import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { IntegrationAuthError } from '../service/integration-auth.service'
import { IntegrationStatusEnum } from '@model'
import {
  AppService,
  FormService,
  IntegrationAuthService,
  IntegrationService,
  SubmissionService
} from '@service'
import { mapToObject } from '@utils'

import { BaseQueue } from './base.queue'

export interface IntegrationQueueJob {
  appId: string
  integrationId: string
  formId: string
  submissionId: string
}

@Processor('IntegrationQueue')
export class IntegrationQueue extends BaseQueue {
  constructor(
    private readonly appService: AppService,
    private readonly integrationService: IntegrationService,
    private readonly integrationAuthService: IntegrationAuthService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService
  ) {
    super()
  }

  @Process()
  async process(job: Job<IntegrationQueueJob>) {
    const { appId, integrationId, formId, submissionId } = job.data
    const app = this.appService.findById(appId)

    if (app) {
      const [integration, submission, form] = await Promise.all([
        this.integrationService.findById(integrationId),
        this.submissionService.findById(submissionId),
        this.formService.findById(formId)
      ])

      if (integration && submission && form) {
        try {
          if (integration.status === IntegrationStatusEnum.NEEDS_RECONNECT) {
            throw new IntegrationAuthError(
              'The account needs reconnecting before deliveries resume',
              true
            )
          }

          // Inside the job, so an expired token is refreshed right before use
          const auth = await this.integrationAuthService.getRunAuth(app, integration)
          const config = mapToObject(integration.config)

          await app.run({
            submission,
            form,
            config,
            auth
          })
        } catch (err) {
          // Retrying with the same credentials can't succeed
          if (err instanceof IntegrationAuthError) {
            await job.discard()
          }

          throw err
        }
      }
    }
  }
}
