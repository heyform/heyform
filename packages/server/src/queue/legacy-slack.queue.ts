/**
 * @program: servers
 * @description: Legacy Slack Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:16
 **/

import { answersToPlain } from '@heyform-inc/answer-utils'
import { LegacySlack } from '@heyforms/integrations'
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

@Processor('LegacySlackQueue')
export class LegacySlackQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService
  ) {
    super(failedTaskService)
  }

  @Process()
  async sendText(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )
    const form = await this.formService.findById(submission.formId)

    const text = answersToPlain(submission.answers)
    const { webhook } = mapToObject(integration.attributes)

    const legacySlack = LegacySlack.init(webhook)
    await legacySlack.sendText([form.name, text].join('\n\n'))
  }
}
