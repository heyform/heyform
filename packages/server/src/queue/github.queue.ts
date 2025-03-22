/**
 * @program: servers
 * @description: Github Integration
 * @author: Mufeng
 * @date: 2021-10-28 15:11
 **/

import { answersToJson } from '@heyform-inc/answer-utils'
import { Github } from '@heyforms/integrations'
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

@Processor('GithubQueue')
export class GithubQueue extends BaseQueue {
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
  async createIssue(job: Job<IntegrationQueueJob>): Promise<any> {
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
    const { repository, assignee, label, milestone, title, body } = mapToObject(
      integration.attributes
    )

    const github = Github.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      redirectUri: app.redirectUri,
      tokens: thirdPartyOauth.tokens as any
    })

    const issue: any = {
      title: json[title],
      body: json[body],
      assignees: [assignee],
      milestone: milestone?.number,
      labels: [label]
    }

    await github.createIssue(repository, issue)
  }
}
