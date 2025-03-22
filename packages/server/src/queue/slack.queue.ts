/**
 * @program: servers
 * @description: Legacy Slack Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:16
 **/

import { answersToPlain } from '@heyform-inc/answer-utils'
import { mapToObject } from '@heyforms/integrations'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  FormService,
  IntegrationService,
  SubmissionService,
  ThirdPartyService
} from '@service'
import { Job } from 'bull'
import { BaseQueue, IntegrationQueueJob } from './base.queue'
import { Slack } from '@utils'

@Processor('SlackQueue')
export class SlackQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService,
    private readonly thirdPartyService: ThirdPartyService
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

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )

    const slack = Slack.init({
      tokens: thirdPartyOauth.tokens
    })

    const form = await this.formService.findById(submission.formId)

    const { channel } = mapToObject(integration.attributes)
    const text = answersToPlain(submission.answers)

    await slack.postMessage(channel.id, [form.name, text].join('\n\n'))
  }
}
