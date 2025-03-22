/**
 * @program: servers
 * @description: Airtable Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { mapToObject } from '@heyforms/integrations'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  IntegrationService,
  SubmissionService,
  ThirdPartyService
} from '@service'
import { Job } from 'bull'
import { Airtable } from '@utils'
import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('AirtableQueue')
export class AirtableQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly thirdPartyService: ThirdPartyService
  ) {
    super(failedTaskService)
  }

  @Process()
  async createRecord(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )

    const json = answersToJson(submission.answers, {
      plain: true
    })

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )

    const { base, table, fields } = mapToObject(integration.attributes)

    const airtable = Airtable.init({
      tokens: thirdPartyOauth.tokens
    })

    const result: Record<string, any> = {}

    fields.forEach(([answerId, key]) => {
      const field = table.fields.find(f => f.id === key)
      const value = json[answerId]

      result[key] = field.type === 'number' ? Number(value) : value
    })

    await airtable.createRecord(base.id, table.id, result)
  }
}
