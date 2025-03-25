import { PublicTeamDetailInput, PublicTeamType } from '@graphql'
import { SubscriptionStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { TeamService, UserService } from '@service'

@Resolver()
export class PublicTeamDetailResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly userService: UserService
  ) {}

  @Query(returns => PublicTeamType)
  async publicTeamDetail(
    @Args('input') input: PublicTeamDetailInput
  ): Promise<PublicTeamType> {
    const team = await this.teamService.findWithPlanById(input.teamId)

    if (!team) {
      throw new BadRequestException('The workspace does not exist')
    }

    const owner = await this.userService.findById(team.ownerId)
    const memberCount = await this.teamService.memberCount(team.id)
    const detail: PublicTeamType = {
      id: team.id,
      name: team.name,
      avatar: team.avatar,
      allowJoinByInviteLink: false,
      memberCount,
      owner
    }

    if (
      team.inviteCode !== input.inviteCode ||
      team.subscription.status !== SubscriptionStatusEnum.ACTIVE
    ) {
      return detail
    }

    if (team.allowJoinByInviteLink) {
      // const teamMemberCount = await this.teamService.memberCount(input.teamId)

      // if (teamMemberCount < team.plan.memberLimit) {
      // }
      detail.allowJoinByInviteLink = true
    }

    return detail
  }
}
