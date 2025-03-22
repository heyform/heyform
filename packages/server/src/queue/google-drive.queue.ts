/**
 * @program: servers
 * @description: Google Drive Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { GoogleDrive } from '@heyforms/integrations'
import { mapToObject } from '@heyforms/integrations'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
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

@Processor('GoogleDriveQueue')
export class GoogleDriveQueue extends BaseQueue {
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

      const googleDrive = GoogleDrive.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        tokens: thirdPartyOauth.tokens as any
      })

      for (const answer of answers) {
        const fileUrl = [answer.value.cdnUrlPrefix, answer.value.cdnKey].join(
          '/'
        )
        await googleDrive.upload(folder.id, fileUrl, answer.value.filename)
      }
    }
  }
}
