import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { helper, timestamp } from '@heyform-inc/utils'
import { ProjectModel, getTeamOwnerIds, isTeamOwner } from '@model'
import { GqlExecutionContext } from '@nestjs/graphql'
import { FormService, ProjectService, TeamService } from '@service'
import { requestParser } from '@utils'

export enum PermissionScopeEnum {
  team = 0,
  project,
  form
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly teamService: TeamService,
    private readonly projectService: ProjectService,
    private readonly formService: FormService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    let req = ctx.getContext()?.req
    let args = ctx.getArgs()

    if (context.getType() === 'http' || helper.isEmpty(req) || helper.isEmpty(args?.input)) {
      req = context.switchToHttp().getRequest()
      args = {
        input: {
          teamId: requestParser(req, ['teamId', 'team_id']),
          projectId: requestParser(req, ['projectId', 'project_id']),
          formId: requestParser(req, ['formId', 'form_id'])
        }
      }
    }

    const user = req.user
    const scope = this.reflector.get<PermissionScopeEnum>('scope', context.getHandler())

    if (helper.isEmpty(user)) {
      throw new UnauthorizedException('Unauthorized')
    }

    let { teamId, projectId } = args.input

    if (scope >= PermissionScopeEnum.form) {
      const formId = args.input.formId
      const form = await this.formService.findById(formId)

      if (!form) {
        throw new BadRequestException('Please make sure you have permission to access this form')
      }

      req.form = {
        id: formId,
        ...form.toObject()
      }

      teamId = form.teamId
      projectId = form.projectId
    }

    let project: ProjectModel | undefined
    if (scope >= PermissionScopeEnum.project) {
      project = await this.projectService.findById(projectId)

      if (!project) {
        throw new BadRequestException('Please make sure you have permission to access this project')
      }

      teamId = project.teamId
    }

    const team = await this.teamService.findById(teamId)

    if (!team) {
      throw new BadRequestException("You don't have permission to access the workspace")
    }

    const member = await this.teamService.findMemberById(teamId, user.id)
    if (!member) {
      throw new BadRequestException("You don't have permission to access the workspace")
    }

    const isOwner = isTeamOwner(team, user.id)

    if (project) {
      if (!isOwner && !(await this.projectService.findMemberById(projectId, user.id))) {
        throw new BadRequestException("You don't have permission to access the workspace")
      }
      req.project = {
        id: projectId,
        ...project.toObject(),
        isOwner: project.ownerId === user.id
      }
    }

    req.team = {
      id: teamId,
      ownerId: team.ownerId,
      ownerIds: getTeamOwnerIds(team),
      isOwner,
      name: team.name,
      role: member?.role,
      storageQuota: team.storageQuota,
      inviteCode: team.inviteCode
    }

    this.teamService.updateMember(teamId, user.id, {
      lastSeenAt: timestamp()
    })

    return true
  }
}
