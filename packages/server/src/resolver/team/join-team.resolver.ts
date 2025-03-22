import { Auth, User } from '@decorator'
import { JoinTeamInput } from '@graphql'
import { SubscriptionStatusEnum, TeamRoleEnum, UserModel } from '@model'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { MailService, TeamService, UserService } from '@service'
import { aesDecryptObject } from '@heyforms/nestjs'
import { ENCRYPTION_KEY } from '@environments'
import { helper, timestamp } from '@heyform-inc/utils'

@Resolver()
@Auth()
export class JoinTeamResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {}

  @Mutation(returns => Boolean)
  async joinTeam(
    @User() user: UserModel,
    @Args('input') input: JoinTeamInput
  ): Promise<boolean> {
    const team = await this.teamService.findWithPlanById(input.teamId)

    if (!team) {
      throw new NotFoundException('The workspace does not exist')
    }

    if (team.subscription.status !== SubscriptionStatusEnum.ACTIVE) {
      throw new BadRequestException('The workspace subscription expired')
    }

    const tokenInfo = aesDecryptObject(input.inviteCode, ENCRYPTION_KEY)

    // Check if the invitation code matches
    if (helper.isEmpty(tokenInfo) || tokenInfo.code !== team.inviteCode) {
      throw new BadRequestException('The invitation code does not match')
    }
    // Check if the workspace is allowed to join
    else if (!team.allowJoinByInviteLink) {
      throw new BadRequestException('The workspace is not allowed to join')
    }
    // Check if the invitation has expired
    else if (tokenInfo.expires < timestamp()) {
      throw new BadRequestException('The invitation has expired')
    }
    // Check if the invitation email matches
    else if (tokenInfo.email !== user.email) {
      throw new BadRequestException('The invitation email does not match')
    }

    const teamMemberCount = await this.teamService.memberCount(input.teamId)

    if (teamMemberCount >= team.plan.memberLimit + team.additionalSeats) {
      throw new BadRequestException(
        'The workspace member quota exceeds, new members are no longer accepted'
      )
    }

    const teamMember = await this.teamService.findMemberById(
      input.teamId,
      user.id
    )

    if (teamMember) {
      throw new BadRequestException("You've already joined the workspace")
    }

    await this.teamService.createMember({
      teamId: input.teamId,
      memberId: user.id,
      role: TeamRoleEnum.COLLABORATOR
    })

    const teamOwner = await this.userService.findById(team.ownerId)

    this.mailService.joinWorkspaceAlert(teamOwner.email, {
      teamName: team.name,
      userName: `${user.name} (${user.email})`
    })

    return true
  }
}
