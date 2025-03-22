/**
 * @program: servers
 * @description: Webhook Integration
 * @author: Mufeng
 * @date: 2021-11-01 10:43
 **/

import got from 'got'
import { mapToObject } from '@heyforms/integrations'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  FormService,
  IntegrationService,
  SubmissionService
} from '@service'
import { Job } from 'bull'
import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('WebhookQueue')
export class WebhookQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService
  ) {
    super(failedTaskService)
  }

  @Process()
  async callWebhook(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )
    const form = await this.formService.findById(submission.formId)
    const { webhook } = mapToObject(integration.attributes)

    await got
      .post(webhook, {
        json: {
          id: submission.id,
          formId: form.id,
          formName: form.name,
          fields: form.fields,
          answers: submission.answers,
          hiddenFields: submission.hiddenFields,
          variables: submission.variables
        }
      })
      .text()
  }
}
