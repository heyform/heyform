import { helper, timestamp } from '@heyform-inc/utils'
import { PlanGradeEnum } from '@model'
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { FormService, ProjectService, TeamService } from '@service'
import { requestParser } from '@utils'

export enum PermissionScopeEnum {
  team = 0,
  project,
  form
}

export class PermissionGuard implements CanActivate {
  private readonly reflector: Reflector

  constructor(
    @Inject('TeamService') private readonly teamService: TeamService,
    @Inject('ProjectService') private readonly projectService: ProjectService,
    @Inject('FormService') private readonly formService: FormService
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
          teamId: requestParser(req, ['teamId', 'team_id']),
          projectId: requestParser(req, ['projectId', 'project_id']),
          formId: requestParser(req, ['formId', 'form_id'])
        }
      }
    }

    const user = req.user
    const scope = this.reflector.get<PermissionScopeEnum>(
      'scope',
      context.getHandler()
    )

    let { teamId, projectId } = args.input

    if (scope >= PermissionScopeEnum.form) {
      const formId = args.input.formId
      const form = await this.formService.findById(formId)

      if (!form) {
        throw new BadRequestException(
          'Please make sure you have permission to access this form'
        )
      }

      req.form = {
        id: formId,
        ...form.toObject()
      }

      teamId = form.teamId
      projectId = form.projectId
    }

    if (scope >= PermissionScopeEnum.project) {
      const project = await this.projectService.findById(projectId)

      if (!project) {
        throw new BadRequestException(
          'Please make sure you have permission to access this project'
        )
      }

      const member = await this.projectService.findMemberById(
        projectId,
        user.id
      )
      if (!member) {
        throw new BadRequestException(
          "You don't have permission to access the workspace"
        )
      }

      req.project = {
        id: projectId,
        ...project.toObject(),
        isOwner: project.ownerId === user.id
      }

      teamId = project.teamId
    }

    const team = await this.teamService.findWithPlanById(teamId)

    if (!team) {
      throw new BadRequestException(
        "You don't have permission to access the workspace"
      )
    }

    const member = await this.teamService.findMemberById(teamId, user.id)
    if (!member) {
      throw new BadRequestException(
        "You don't have permission to access the workspace"
      )
    }

    // Only team owner can access the team with Free Plan
    const isOwner = team.ownerId === user.id
    if (team.plan.grade === PlanGradeEnum.FREE && !isOwner) {
      throw new BadRequestException(
        "You don't have permission to access the workspace"
      )
    }

    req.team = {
      id: teamId,
      ownerId: team.ownerId,
      isOwner,
      name: team.name,
      role: member.role,
      storageQuota: team.storageQuota,
      // Discard at Dec 20, 2021 (v2021.12.3)
      // submissionQuota: team.submissionQuota,
      plan: team.plan,
      subscription: team.subscription,
      inviteCode: team.inviteCode,
      // Add at Dec 29, 2021 (v2021.12.4)
      additionalSeats: team.additionalSeats
    }

    // Update team member last activity date
    this.teamService.updateMember(teamId, user.id, {
      lastSeenAt: timestamp()
    })

    return true
  }
}
