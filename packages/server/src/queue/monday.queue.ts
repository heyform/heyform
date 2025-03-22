/**
 * @program: servers
 * @description: Monday Integration
 * @author: Mufeng
 * @date: 2021-06-29 15:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { Monday } from '@heyforms/integrations'
import { mapToObject } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { Process, Processor } from '@nestjs/bull'
import {
  AppService,
  FailedTaskService,
  IntegrationService,
  SubmissionService,
  ThirdPartyService
} from '@service'
import { Job } from 'bull'
import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('MondayQueue')
export class MondayQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly appService: AppService,
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService
  ) {
    super(failedTaskService)
  }

  @Process()
  async createItem(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )
    const app = await this.appService.findById(integration.appId)
    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )

    const json = answersToJson(submission.answers, {
      plain: true
    })
    const { board, group, itemName, fields } = mapToObject(
      integration.attributes
    )

    const monday = Monday.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    const result: any = {}
    if (helper.isValidArray(fields)) {
      fields.forEach(([answerId, key]) => {
        result[key] = json[answerId]
      })
    }

    await monday.createItem(board.id, group.id, json[itemName], result)
  }
}
