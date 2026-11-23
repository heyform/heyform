import { BadRequestException } from '@nestjs/common'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { TransferTeamInput } from '@graphql'
import { TeamModel, UserModel, isTeamOwner } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { TeamMemberService, TeamService } from '@service'

@Resolver()
@Auth()
export class RemoveTeamMemberResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly teamMemberService: TeamMemberService
  ) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async removeTeamMember(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: TransferTeamInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException('This operation is not allowed in the workspace')
    }

    const member = await this.teamService.findMemberById(input.teamId, input.memberId)

    if (!member) {
      throw new BadRequestException('The member in the workspace does not exist')
    }

    if (isTeamOwner(team, input.memberId)) {
      throw new BadRequestException('This operation is not allowed in the workspace')
    }

    await this.teamMemberService.remove(input.teamId, input.memberId, user.id)

    return true
  }
}
