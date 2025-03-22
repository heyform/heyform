/**
 * @program: servers
 * @description: Gitlab Integration
 * @author: Mufeng
 * @date: 2021-10-28 15:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { Gitlab } from '@heyforms/integrations'
import { mapToObject } from '@heyforms/integrations'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  IntegrationService,
  SubmissionService
} from '@service'
import { Job } from 'bull'
import { BaseQueue, IntegrationQueueJob } from './base.queue'

@Processor('GitlabQueue')
export class GitlabQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService
  ) {
    super(failedTaskService)
  }

  @Process()
  async createIssue(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )

    const json = answersToJson(submission.answers, {
      plain: true
    })
    const {
      server,
      token,
      project,
      member,
      label,
      milestone,
      title,
      body
    } = mapToObject(integration.attributes)

    const gitlab = Gitlab.init({
      clientSecret: token,
      server
    })

    const issue: any = {
      title: json[title],
      description: json[body],
      assignee_ids: [member.id],
      milestone_id: milestone.id,
      labels: [label.name]
    }

    await gitlab.createIssue(project.id, issue)
  }
}
