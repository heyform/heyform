/**
 * @program: servers
 * @description: Email Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:10
 **/

import { APP_HOMEPAGE } from '@environments'
import { answersToHtml } from '@heyform-inc/answer-utils'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  FormService,
  MailService,
  SubmissionService,
  UserService
} from '@service'
import { Job } from 'bull'
import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('EmailQueue')
export class EmailQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly submissionService: SubmissionService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly formService: FormService
  ) {
    super(failedTaskService)
  }

  @Process()
  async sendNotification(job: Job<IntegrationQueueJob>): Promise<any> {
    const [submission, form] = await Promise.all([
      this.submissionService.findById(job.data.submissionId),
      this.formService.findById(job.data.formId)
    ])

    const user = await this.userService.findById(form.memberId)
    const html = answersToHtml(submission.answers)

    await this.mailService.submissionNotification(user.email, {
      formName: form.name,
      submission: html,
      link: `${APP_HOMEPAGE}/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/submissions`
    })
  }
}
