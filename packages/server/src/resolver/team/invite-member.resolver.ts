import { BadRequestException, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { InviteMemberInput } from '@graphql'
import { GqlThrottlerGuard } from '@guard'
import { ms } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { TeamMemberService } from '@service'

@Resolver()
@Auth()
@UseGuards(GqlThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: ms('1h') } })
export class InviteMemberResolver {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async inviteMember(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: InviteMemberInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException("You don't have permission to invite member")
    }

    await this.teamMemberService.invite(team, user, input.emails)

    return true
  }
}
