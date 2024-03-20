import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import got from 'got'

import { FormService, IntegrationService, SubmissionService } from '@service'
import { mapToObject } from '@utils'

import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('WebhookQueue')
export class WebhookQueue extends BaseQueue {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService
  ) {
    super()
  }

  @Process()
  async callWebhook(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(job.data.integrationId)
    const submission = await this.submissionService.findById(job.data.submissionId)
    const form = await this.formService.findById(submission.formId)
    const { webhook } = mapToObject(integration.attributes)

    await got
      .post(webhook, {
        json: {
          id: submission.id,
          formId: form.id,
          formName: form.name,
          fields: form.fields,
          answers: submission.answers
        }
      })
      .text()
  }
}
