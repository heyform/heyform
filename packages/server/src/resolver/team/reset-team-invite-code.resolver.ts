import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, Team, TeamGuard } from '@decorator'
import { TeamDetailInput } from '@graphql'
import { TeamModel } from '@model'
import { TeamService } from '@service'

@Resolver()
@Auth()
export class ResetTeamInviteCodeResolver {
  constructor(private readonly teamService: TeamService) {}

  @Mutation(() => Boolean)
  @TeamGuard()
  async resetTeamInviteCode(
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException("You don't have permission to reset workspace invite code")
    }

    await this.teamService.resetInviteCode(input.teamId)
    return true
  }
}
