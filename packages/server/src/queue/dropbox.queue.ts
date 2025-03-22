/**
 * @program: heyform-serves
 * @description: Dropbox queue
 * @author: mufeng
 * @date: 11/2/21 10:53 AM
 **/

import { BaseQueue, IntegrationQueueJob } from './base.queue'
import { Process, Processor } from '@nestjs/bull'
import {
  AppService,
  FailedTaskService,
  IntegrationService,
  SubmissionService,
  ThirdPartyService
} from '@service'
import { Job } from 'bull'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { mapToObject } from '@heyforms/integrations'
import { Dropbox } from '@heyforms/integrations'

@Processor('DropboxQueue')
export class DropboxQueue extends BaseQueue {
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
    const answers = submission.answers.filter(
      answer => answer.kind === FieldKindEnum.FILE_UPLOAD
    )

    if (helper.isValid(answers)) {
      const app = await this.appService.findById(integration.appId)
      const thirdPartyOauth = await this.thirdPartyService.findById(
        integration.thirdPartyOauthId
      )

      const { folder } = mapToObject(integration.attributes)

      const dropbox = Dropbox.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        tokens: thirdPartyOauth.tokens as any
      })

      for (const answer of answers) {
        const fileUrl = [answer.value.cdnUrlPrefix, answer.value.cdnKey].join(
          '/'
        )
        await dropbox.upload(folder.id, fileUrl, answer.value.filename)
      }
    }
  }
}
