/**
 * @program: servers
 * @description: Mailchimp Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { Mailchimp } from '@heyforms/integrations'
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

@Processor('MailchimpQueue')
export class MailchimpQueue extends BaseQueue {
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
  async upload(job: Job<IntegrationQueueJob>): Promise<any> {
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

    const json = answersToJson(submission.answers)
    const { audience, email, fullName, address, phoneNumber } = mapToObject(
      integration.attributes
    )

    const mailchimp = Mailchimp.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    const name = json[fullName]
    const addr = json[address]

    const contact: any = {
      status: 'subscribed',
      email_address: json[email],
      merge_fields: {
        FNAME: name,
        PHONE: json[phoneNumber]
      }
    }

    if (helper.isObject(name)) {
      contact.merge_fields.FNAME = name.firstName
      contact.merge_fields.LNAME = name.lastName
    }

    if (helper.isObject(addr)) {
      contact.merge_fields.ADDRESS = {
        addr1: addr.address1,
        addr2: addr.address2,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country
      }
    }

    await mailchimp.createOrUpdateContact(audience.id, contact)
  }
}
