/**
 * @program: servers
 * @description: Osticket Integration
 * @author: Mufeng
 * @date: 2022-07-15 13:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { Osticket } from '@heyforms/integrations'
import { mapToObject } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  IntegrationService,
  SubmissionService
} from '@service'
import { Job } from 'bull'
import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('OsticketQueue')
export class OsticketQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService
  ) {
    super(failedTaskService)
  }

  @Process()
  async createTicket(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )
    const json = answersToJson(submission.answers)

    const {
      serverURL,
      apiKey,
      name,
      email,
      phone,
      subject,
      message
    } = mapToObject(integration.attributes)

    const osticket = Osticket.init({
      server: serverURL,
      clientSecret: apiKey
    })

    const result: Record<string, any> = {
      name: json[name],
      email: json[email],
      phone: json[phone],
      subject: json[subject],
      message: json[message],
      ip: submission.ip
    }

    if (helper.isObject(result.name)) {
      result.name = [result.name.firstName, result.name.lastName].join(' ')
    }

    await osticket.createTicket(result as any)
  }
}
