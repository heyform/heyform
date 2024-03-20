import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, User } from '@decorator'
import { JoinTeamInput } from '@graphql'
import { TeamRoleEnum, UserModel } from '@model'
import { MailService, TeamService, UserService } from '@service'

@Resolver()
@Auth()
export class JoinTeamResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {}

  @Mutation(returns => Boolean)
  async joinTeam(@User() user: UserModel, @Args('input') input: JoinTeamInput): Promise<boolean> {
    const team = await this.teamService.findById(input.teamId)

    if (!team) {
      throw new NotFoundException('The workspace does not exist')
    }

    if (team.inviteCode !== input.inviteCode) {
      throw new BadRequestException('The invitation code of the workspace does not match')
    }

    if (!team.allowJoinByInviteLink) {
      throw new BadRequestException('The workspace is not allowed to join')
    }

    const teamMember = await this.teamService.findMemberById(input.teamId, user.id)

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
