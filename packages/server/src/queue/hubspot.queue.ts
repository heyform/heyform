/**
 * @program: servers
 * @description: Hubspot Integration
 * @author: Mufeng
 * @date: 2021-06-29 15:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { Hubspot } from '@heyforms/integrations'
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

@Processor('HubspotQueue')
export class HubspotQueue extends BaseQueue {
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
  async createContact(job: Job<IntegrationQueueJob>): Promise<any> {
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
      plain: false
    })
    const fields = mapToObject(integration.attributes)

    const hubspot = Hubspot.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    const result: any = {}
    Object.keys(fields).forEach(key => {
      const answerId = fields[key]
      const value = json[answerId]

      if (key === 'fullname') {
        if (helper.isObject(value)) {
          result.firstname = value.firstName
          result.lastname = value.lastName
        } else {
          result.firstname = value
        }
      } else {
        result[key] = value
      }
    })

    await hubspot.createContact(result)
  }
}
