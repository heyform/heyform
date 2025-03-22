/**
 * @program: servers
 * @description: Lark Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { answersToPlain } from '@heyform-inc/answer-utils'
import { Lark } from '@heyforms/integrations'
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

@Processor('LarkQueue')
export class LarkQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService
  ) {
    super(failedTaskService)
  }

  @Process()
  async sendPost(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )
    const form = await this.formService.findById(submission.formId)

    const text = answersToPlain(submission.answers)
    const { webhook } = mapToObject(integration.attributes)

    const lark = Lark.init(webhook)
    await lark.sendPost({
      en: {
        title: form.name,
        content: [
          [
            {
              tag: 'text',
              text
            }
          ]
        ]
      }
    })
  }
}
