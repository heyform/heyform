import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { answersToHtml } from '@heyform-inc/answer-utils'

import { APP_HOMEPAGE_URL } from '@environments'
import { FormService, IntegrationService, MailService, SubmissionService } from '@service'
import { mapToObject } from '@utils'

import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('IntegrationEmailQueue')
export class IntegrationEmailQueue extends BaseQueue {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly mailService: MailService,
    private readonly formService: FormService
  ) {
    super()
  }

  @Process()
  async sendNotification(job: Job<IntegrationQueueJob>): Promise<any> {
    const [integration, submission] = await Promise.all([
      this.integrationService.findById(job.data.integrationId),
      this.submissionService.findById(job.data.submissionId)
    ])
    const form = await this.formService.findById(submission.formId)

    const html = answersToHtml(submission.answers)
    const { email } = mapToObject(integration.attributes)

    await this.mailService.submissionNotification(email, {
      formName: form.name,
      submission: html,
      link: `${APP_HOMEPAGE_URL}/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/submissions`
    })
  }
}
