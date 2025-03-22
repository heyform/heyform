import { answersToJson } from '@heyform-inc/answer-utils'
import { SupportPal } from '@heyforms/integrations'
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

@Processor('SupportpalQueue')
export class SupportpalQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
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
    const json = answersToJson(submission.answers)

    const {
      systemURL,
      token,
      department,
      priority,
      userName,
      email,
      subject,
      text,
      status
    } = mapToObject(integration.attributes)

    const airtable = SupportPal.init({
      supportPalBaseUri: systemURL,
      clientSecret: token
    })

    const result: Record<string, any> = {
      user_email: json[email],
      subject: json[subject],
      text: json[text],
      department: department.id,
      priority: priority.id,
      status: status.id
    }

    const name = json[userName]
    if (helper.isObject(name)) {
      result.user_firstname = name.firstName
      result.user_lastname = name.lastName
    } else {
      result.user_firstname = name
      result.user_lastname = ''
    }

    await airtable.createTicket(result as any)
  }
}
