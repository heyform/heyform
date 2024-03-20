import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { APP_HOMEPAGE_URL } from '@environments'
import { InviteMemberInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { MailService, TeamService, UserService } from '@service'

@Resolver()
@Auth()
export class InviteMemberResolver {
  constructor(
    private readonly userService: UserService,
    private readonly teamService: TeamService,
    private readonly mailService: MailService
  ) {}

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

    let exists: string[] = []
    const members = await this.teamService.findMembersInTeam(input.teamId)

    if (helper.isValid(members)) {
      exists = (await this.userService.findAll(members.map(member => member.memberId))).map(
        row => row.email
      )
    }

    const emails = helper.uniqueArray(input.emails.filter(email => !exists.includes(email)))

    for (const email of emails) {
      this.mailService.teamInvitation(email, {
        userName: user.name,
        teamName: team.name,
        link: `${APP_HOMEPAGE_URL}/workspace/${team.id}/invitation/${team.inviteCode}`
      })
    }

    return true
  }
}
