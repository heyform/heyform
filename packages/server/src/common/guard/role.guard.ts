import { helper } from '@heyform-inc/utils'
import { SubscriptionStatusEnum, TeamModel, TeamRoleEnum } from '@model'
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { FormService, TeamService } from '@service'

export enum RoleGuardScopeEnum {
  team,
  form
}

function parseRequest(req: any, keys: string[]): any {
  const sources = ['body', 'query', 'params']
  let value: any

  for (const source of sources) {
    for (const key of keys) {
      const searchValue = req[source][key]

      if (helper.isValid(searchValue)) {
        value = searchValue
        break
      }
    }
  }

  return value
}

export class RoleGuard implements CanActivate {
  private readonly reflector: Reflector

  constructor(
    @Inject('FormService') private readonly formService: FormService,
    @Inject('TeamService') private readonly teamService: TeamService
  ) {
    this.reflector = new Reflector()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    let { req } = ctx.getContext()
    let args = ctx.getArgs()

    if (helper.isEmpty(req)) {
      req = context.switchToHttp().getRequest()
      args = {
        input: {
          teamId: parseRequest(req, ['teamId', 'team_id']),
          formId: parseRequest(req, ['formId', 'form_id'])
        }
      }
    }

    const user = req.user

    const scope = this.reflector.get<RoleGuardScopeEnum>(
      'scope',
      context.getHandler()
    )
    const roles = this.reflector.get<TeamRoleEnum[]>(
      'roles',
      context.getHandler()
    )

    let teamId = args.input.teamId
    let team: TeamModel = null

    if (scope === RoleGuardScopeEnum.form) {
      const formId = args.input.formId
      const form = await this.formService.findById(formId)

      if (!form) {
        throw new BadRequestException('The form does not exist')
      }

      req.form = {
        id: form.id,
        ...form.toObject()
      }

      teamId = form.teamId
    }

    team = await this.teamService.findWithPlanById(teamId)

    if (!team) {
      throw new BadRequestException('The workspace does not exist')
    }

    const isOwner = team.ownerId === user.id

    // Non-owner members can't access the workspace if the workspace subscription expires
    if (
      team.subscription.status !== SubscriptionStatusEnum.ACTIVE &&
      !isOwner
    ) {
      throw new BadRequestException({
        code: 'WORKSPACE_SUBSCRIPTION_EXPIRED',
        message: 'The workspace subscription has expired'
      })
    }

    const member = await this.teamService.findMemberById(teamId, user.id)
    const ownerRequired = roles.includes(TeamRoleEnum.OWNER)

    if (ownerRequired) {
      if (!isOwner) {
        throw new BadRequestException(
          'This operation is not allowed in the workspace'
        )
      }
    } else {
      if (!member || !roles.includes(member.role)) {
        throw new BadRequestException(
          'This operation is not allowed in the workspace'
        )
      }
    }

    req.team = {
      id: team.id,
      ownerId: team.ownerId,
      isOwner,
      role: member.role,
      storageQuota: team.storageQuota,
      plan: team.plan,
      subscription: team.subscription
    }

    return true
  }
}
