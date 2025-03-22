/**
 * @program: serves
 * @description:
 * @author: mufeng
 * @date: 12/27/21 1:44 PM
 **/

import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  FormAnalyticService,
  FormService,
  MailService,
  PaymentService,
  SocialLoginService,
  SubmissionService,
  TeamService,
  UserService
} from '@service'
import { BaseQueue } from '../queue/base.queue'

@Processor('DeleteUserAccountSchedule')
export class DeleteUserAccountSchedule extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly userService: UserService,
    private readonly socialLoginService: SocialLoginService,
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly formAnalyticService: FormAnalyticService,
    private readonly submissionService: SubmissionService,
    private readonly mailService: MailService,
    private readonly paymentService: PaymentService
  ) {
    super(failedTaskService)
  }

  @Process()
  async deleteUserAccount(): Promise<any> {
    const users = await this.userService.findAllDeletionScheduled()

    if (users.length > 0) {
      for (const user of users) {
        const userId = user.id

        // Delete user
        await this.userService.delete(userId)

        // Delete user's social login accounts
        await this.socialLoginService.deleteByUserId(userId)

        const teams = await this.teamService.findAll(userId)

        for (const team of teams) {
          const teamId = team.id

          if (team.ownerId === userId) {
            // Delete own team

            // Cancel own team's subscription
            await this.paymentService.cancelSubscription(team.subscription.id)

            await this.teamService.delete(teamId)
            await this.teamService.deleteAllMemberInTeam(teamId)

            const forms = await this.formService.findAllInTeam(teamId)
            const formIds = forms.map(form => form.id)

            if (formIds.length > 0) {
              await this.formService.delete(formIds)
              await this.formAnalyticService.delete(formIds)
              await this.submissionService.deleteAll(formIds)
            }
          } else {
            // Leave from team
            await this.teamService.deleteMember(teamId, userId)
          }

          await this.mailService.accountDeletionAlert(user.email)
        }
      }
    }
  }
}
