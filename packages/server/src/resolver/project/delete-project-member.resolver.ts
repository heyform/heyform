import { BadRequestException } from '@nestjs/common'

import { Auth, Project, ProjectGuard, Team } from '@decorator'
import { ProjectMemberInput } from '@graphql'
import { ProjectModel, TeamModel, TeamRoleEnum, isTeamOwner } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService } from '@service'

@Resolver()
@Auth()
export class DeleteProjectMemberResolver {
  constructor(private readonly projectService: ProjectService) {}

  @ProjectGuard()
  @Mutation(returns => Boolean)
  async deleteProjectMember(
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

    if (isTeamOwner(team, input.memberId) || input.memberId === project.ownerId) {
      throw new BadRequestException("You don't have permission to remove member from the project")
    }

    return this.projectService.deleteMember(input.projectId, input.memberId)
  }
}
