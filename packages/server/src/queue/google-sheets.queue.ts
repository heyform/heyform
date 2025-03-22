/**
 * @program: servers
 * @description: Google Sheets Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { GoogleSheets } from '@heyforms/integrations'
import { mapToObject } from '@heyforms/integrations'
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

@Processor('GoogleSheetsQueue')
export class GoogleSheetsQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly appService: AppService,
    private readonly thirdPartyService: ThirdPartyService
  ) {
    super(failedTaskService)
  }

  @Process()
  async append(job: Job<IntegrationQueueJob>): Promise<any> {
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
    const { spreadsheet, worksheet, fields } = mapToObject(
      integration.attributes
    )

    const googleSheets = GoogleSheets.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    const result: string[] = []
    fields.forEach(([answerId, index]) => {
      result[index] = json[answerId]
    })

    await googleSheets.append(spreadsheet.id, `${worksheet}!A:A`, [result])
  }
}
