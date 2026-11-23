import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { Process, Processor } from '@nestjs/bull'

import {
  FormService,
  MailService,
  SocialLoginService,
  SubmissionService,
  TeamService,
  UserService
} from '@service'

import { BaseQueue } from '../queue/base.queue'

@Processor('DeleteUserAccountSchedule')
export class DeleteUserAccountSchedule extends BaseQueue {
  constructor(
    private readonly userService: UserService,
    private readonly socialLoginService: SocialLoginService,
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService,
    private readonly mailService: MailService
  ) {
    super()
  }

  @Process()
  async deleteUserAccount(): Promise<any> {
    const users = await this.userService.findAllDeletionScheduled()

    if (users.length > 0) {
      for (const user of users) {
        const userId = user.id

        const teams = await this.teamService.findAllForAccountDeletion(userId)

        for (const team of teams) {
          const teamId = team.id

          await this.teamService.removeAccountFromTeam(teamId, userId, async () => {
            const forms = await this.formService.findAllInTeam(teamId)
            const formIds = forms.map(form => form.id)

            if (formIds.length > 0) {
              await this.formService.updateMany(formIds, {
                'settings.active': false,
                status: FormStatusEnum.TRASH
              })
              await this.submissionService.deleteAll(formIds)
              await this.formService.delete(formIds)
            }

            await this.teamService.deleteAllMemberInTeam(teamId)
            await this.teamService.delete(teamId)
          })
        }

        // Delete user's social login accounts before deleting the user itself.
        await this.socialLoginService.deleteByUserId(userId)
        await this.userService.delete(userId)

        await this.mailService.accountDeletionAlert(user.email, user.lang)
      }
    }
  }
}
