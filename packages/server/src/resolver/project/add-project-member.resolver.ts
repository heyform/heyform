import { BadRequestException } from '@nestjs/common'

import { Auth, Project, ProjectGuard, Team } from '@decorator'
import { ProjectMemberInput } from '@graphql'
import { ProjectModel, TeamModel, TeamRoleEnum, isTeamOwner } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService, TeamService } from '@service'

@Resolver()
@Auth()
export class AddProjectMemberResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly teamService: TeamService
  ) {}

  @ProjectGuard()
  @Mutation(returns => Boolean)
  async addProjectMember(
    @Team() team: TeamModel,
    @Project() project: ProjectModel,
    @Args('input') input: ProjectMemberInput
  ): Promise<boolean> {
    const canManageMembers =
      team.isOwner ||
      project.isOwner ||
      (team as TeamModel & { role?: TeamRoleEnum }).role === TeamRoleEnum.OWNER ||
      (team as TeamModel & { role?: TeamRoleEnum }).role === TeamRoleEnum.ADMIN

    if (!canManageMembers) {
      throw new BadRequestException("You don't have permission to manage project members")
    }

    const teamMember = await this.teamService.findMemberById(team.id, input.memberId)

    if (!teamMember) {
      throw new BadRequestException('The member does not belong to this workspace')
    }

    if (
      isTeamOwner(team, input.memberId) ||
      (await this.projectService.findMemberById(input.projectId, input.memberId))
    ) {
      throw new BadRequestException('The member already exists in this project')
    }

    return this.projectService.createMember({
      projectId: input.projectId,
      memberId: input.memberId
    })
  }
}
