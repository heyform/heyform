import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { APP_HOMEPAGE_URL } from '@environments'
import { answersToHtml } from '@heyform-inc/answer-utils'
import { FormService, MailService, SubmissionService, UserService } from '@service'

import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('SubmissionNotificationQueue')
export class SubmissionNotificationQueue extends BaseQueue {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly mailService: MailService,
    private readonly formService: FormService,
    private readonly userService: UserService
  ) {
    super()
  }

  @Process()
  async process(job: Job<IntegrationQueueJob>): Promise<any> {
    const [submission, form] = await Promise.all([
      this.submissionService.findById(job.data.submissionId),
      this.formService.findById(job.data.formId)
    ])

    const user = await this.userService.findById(form.memberId)
    const html = answersToHtml(submission.answers)

    await this.mailService.submissionNotification(
      user.email,
      {
        formName: form.name,
        submission: html,
        link: `${APP_HOMEPAGE_URL}/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/submissions`
      },
      user.lang
    )
  }
}
