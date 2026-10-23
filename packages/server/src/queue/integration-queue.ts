import { OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { IntegrationAuthError } from '../service/integration-auth.service'
import { IntegrationRecordStatusEnum, IntegrationStatusEnum } from '@model'
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

// Returned when there was nothing to deliver, e.g. the integration was deleted
export const SKIPPED_JOB = 'skipped'

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

          // Not the app's result, which Bull would store in Redis
          return
        } catch (err) {
          // Retrying with the same credentials can't succeed
          if (err instanceof IntegrationAuthError) {
            await job.discard()
          }

          throw err
        }
      }
    }

    return SKIPPED_JOB
  }

  // Each attempt is recorded for the form owner. Bull emits these events on
  // the worker that ran the job, including for timeouts.
  @OnQueueCompleted()
  async recordSuccess(job: Job<IntegrationQueueJob>, result: unknown) {
    if (result !== SKIPPED_JOB) {
      // attemptsMade only counts failed attempts
      await this.record(job, IntegrationRecordStatusEnum.SUCCEEDED, job.attemptsMade + 1)
    }
  }

  @OnQueueFailed()
  async recordFailure(job: Job<IntegrationQueueJob>, error: Error) {
    const maxAttempts = job.opts.attempts || 1

    // attemptsMade already includes this attempt
    await this.record(job, IntegrationRecordStatusEnum.FAILED, job.attemptsMade, {
      willRetry: !(error instanceof IntegrationAuthError) && job.attemptsMade < maxAttempts,
      error: error?.message || job.failedReason || 'Unknown error'
    })
  }

  private async record(
    job: Job<IntegrationQueueJob>,
    status: IntegrationRecordStatusEnum,
    attempt: number,
    extra: { willRetry?: boolean; error?: string } = {}
  ) {
    const { appId, integrationId, formId, submissionId } = job.data

    try {
      await this.integrationService.addRecord({
        formId,
        appId,
        integrationId,
        submissionId,
        status,
        attempt,
        maxAttempts: Math.max(job.opts.attempts || 1, attempt),
        ...extra
      })
    } catch (err: any) {
      // The log is best effort; it must not affect delivery
      this.logger.error(`Couldn't record ${job.queue?.name}#${job.id}: ${err?.message}`)
    }
  }
}
