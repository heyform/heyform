/**
 * @program: servers
 * @description: Telegram Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { answersToPlain } from '@heyform-inc/answer-utils'
import { Telegram } from '@heyforms/integrations'
import { mapToObject } from '@heyforms/integrations'
import { Process, Processor } from '@nestjs/bull'
import {
  AppService,
  FailedTaskService,
  FormService,
  IntegrationService,
  SubmissionService
} from '@service'
import { Job } from 'bull'
import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('TelegramQueue')
export class TelegramQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService,
    private readonly appService: AppService
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
    const app = await this.appService.findById(integration.appId)
    const form = await this.formService.findById(submission.formId)

    const text = answersToPlain(submission.answers)
    const { webhook } = mapToObject(app.config)
    const { chatId } = mapToObject(integration.attributes)

    const telegram = Telegram.init(webhook)
    await telegram.sendText(chatId, [form.name, text].join('\n\n'))
  }
}
