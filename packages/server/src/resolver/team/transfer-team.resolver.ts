import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, Team, TeamGuard } from '@decorator'
import { TransferTeamInput } from '@graphql'
import { TeamModel, TeamRoleEnum } from '@model'
import { ProjectService, TeamService } from '@service'

@Resolver()
@Auth()
export class TransferTeamResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly projectService: ProjectService
  ) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async transferTeam(
    @Team() team: TeamModel,
    @Args('input') input: TransferTeamInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException("You don't have permission to transfer workspace")
    }

    const member = await this.teamService.findMemberById(team.id, input.memberId)

    if (!member) {
      throw new BadRequestException('The workspace member does not exist')
    }

    await this.teamService.update(team.id, {
      ownerId: input.memberId
    })

    await this.teamService.updateMember(team.id, input.memberId, {
      role: TeamRoleEnum.ADMIN
    })

    const allProjects = await this.projectService.findAllInTeam(team.id)

    if (allProjects.length > 0) {
      const projectIds = await this.projectService.findProjectsByMemberId(input.memberId)
      const notJoined = allProjects.filter(project => !projectIds.includes(project.id))

      await this.projectService.addMembers(
        notJoined.map(row => ({
          projectId: row.id,
          memberId: input.memberId
        }))
      )
    }

    return true
  }
}
