import { Auth, Team, TeamGuard, User } from '@decorator'
import { APP_HOMEPAGE, ENCRYPTION_KEY } from '@environments'
import { InviteMemberInput } from '@graphql'
import { helper, hs, timestamp } from '@heyform-inc/utils'
const { uniqueArray } = helper
import { TeamModel, UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { MailService, TeamService, UserService } from '@service'
import { aesEncryptObject } from '@heyforms/nestjs'

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
      throw new BadRequestException(
        "You don't have permission to invite member"
      )
    }

    let exists: string[] = []
    const members = await this.teamService.findMembersInTeam(input.teamId)

    if (helper.isValid(members)) {
      exists = (
        await this.userService.findAll(members.map(member => member.memberId))
      ).map(row => row.email)
    }

    const emails = uniqueArray(input.emails.map(e => e.toLowerCase())).filter(
      e => !exists.includes(e) && e !== user.email && e.length < 50
    )

    for (const email of emails) {
      const token = aesEncryptObject(
        {
          email,
          expires: timestamp() + hs('7d'),
          code: team.inviteCode
        },
        ENCRYPTION_KEY
      )

      this.mailService.teamInvitation(email, {
        userName: user.name,
        teamName: team.name,
        link: `${APP_HOMEPAGE}/workspace/${team.id}/invitation/${token}`
      })
    }

    return true
  }
}
