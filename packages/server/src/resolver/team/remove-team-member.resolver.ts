import { Auth, Team, TeamGuard } from '@decorator'
import { TransferTeamInput } from '@graphql'
import { TeamModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService, TeamService } from '@service'

@Resolver()
@Auth()
export class RemoveTeamMemberResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly projectService: ProjectService
  ) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async removeTeamMember(
    @Team() team: TeamModel,
    @Args('input') input: TransferTeamInput
  ): Promise<boolean> {
    // 只有 team owner 可以删除成员
    if (!team.isOwner) {
      throw new BadRequestException(
        'This operation is not allowed in the workspace'
      )
    }

    const member = await this.teamService.findMemberById(
      input.teamId,
      input.memberId
    )

    if (!member) {
      throw new BadRequestException(
        'The member in the workspace does not exist'
      )
    }

    // 禁止移除 owner
    if (input.memberId === team.ownerId) {
      throw new BadRequestException(
        'This operation is not allowed in the workspace'
      )
    }

    await this.teamService.deleteMember(input.teamId, input.memberId)

    const projects = await this.projectService.findAllInTeam(input.teamId)
    if (projects.length > 0) {
      await this.projectService.deleteMemberInProjects(
        projects.map(row => row.id),
        input.memberId
      )
    }

    return true
  }
}
