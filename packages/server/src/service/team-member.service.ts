import { Injectable } from '@nestjs/common'

import { MailService } from './mail.service'
import { ProjectService } from './project.service'
import { RedisService } from './redis.service'
import { TeamService } from './team.service'
import { UserService } from './user.service'
import { APP_HOMEPAGE_URL } from '@environments'
import { helper } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { normalizeInvitationRecipients } from '@utils'

const INVITATION_RECIPIENT_HOURLY_LIMIT = 100

@Injectable()
export class TeamMemberService {
  constructor(
    private readonly userService: UserService,
    private readonly teamService: TeamService,
    private readonly projectService: ProjectService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService
  ) {}

  // Emails the workspace invite link to recipients who are not members yet.
  async invite(team: TeamModel, user: UserModel, submittedEmails: string[]): Promise<string[]> {
    let exists: string[] = []
    const members = await this.teamService.findMembersInTeam(team.id)

    if (helper.isValid(members)) {
      exists = (await this.userService.findAll(members.map(member => member.memberId))).map(
        row => row.email
      )
    }

    const emails = normalizeInvitationRecipients(submittedEmails, exists)

    if (emails.length < 1) {
      return emails
    }

    await this.redisService.throttler(
      `invite-member:user:${user.id}`,
      INVITATION_RECIPIENT_HOURLY_LIMIT,
      '1h',
      emails.length
    )
    await this.redisService.throttler(
      `invite-member:team:${team.id}`,
      INVITATION_RECIPIENT_HOURLY_LIMIT,
      '1h',
      emails.length
    )

    await Promise.all(
      emails.map(email =>
        this.mailService.teamInvitation(
          email,
          {
            userName: user.name,
            teamName: team.name,
            link: `${APP_HOMEPAGE_URL}/workspace/${team.id}/invitation/${team.inviteCode}`
          },
          user.lang
        )
      )
    )

    return emails
  }

  // Removes the member from the workspace and all of its projects.
  async remove(teamId: string, memberId: string, actorId: string): Promise<void> {
    await this.teamService.deleteMember(teamId, memberId, actorId)

    const projects = await this.projectService.findAllInTeam(teamId)
    if (projects.length > 0) {
      await this.projectService.deleteMemberInProjects(
        projects.map(row => row.id),
        memberId
      )
    }
  }
}
