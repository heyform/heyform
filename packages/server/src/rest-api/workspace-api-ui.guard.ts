import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AuthGuard } from '../common/guard/auth.guard'
import { TeamService } from '../service'
import { TeamRoleEnum } from '../model/team-member.model'
import { restApiUiFeatures } from './rest-api-features'

@Injectable()
export class WorkspaceApiUiGuard implements CanActivate {
  constructor(private readonly auth: AuthGuard, private readonly teams: TeamService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const features = restApiUiFeatures()
    const feature = context.getHandler().name
    if (!features.enabled ||
        (feature === 'documentation' ? !features.swagger : !features.keyManagement)) {
      throw new NotFoundException()
    }
    // Cookie-authenticated mutations require an explicit same-origin browser request.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.get('sec-fetch-site') !== 'same-origin' ||
          req.get('x-heyform-api-ui') !== '1' ||
          !req.get('origin') ||
          (req.method === 'POST' && !req.is('application/json'))) {
        throw new ForbiddenException('Cross-origin or invalid administrative request')
      }
    }
    await this.auth.canActivate(context)
    const id = req.params.workspaceId
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new NotFoundException()
    const team = await this.teams.findById(id)
    if (!team || !req.user || req.user.isBlocked || req.user.isDeletionScheduled) throw new ForbiddenException()
    const member = await this.teams.findMemberById(id, req.user.id)
    if (team.ownerId !== req.user.id && member?.role !== TeamRoleEnum.ADMIN) throw new ForbiddenException()
    return true
  }
}
