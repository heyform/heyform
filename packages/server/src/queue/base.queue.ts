import { OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull'
import { FailedTaskService } from '@service'
import { Logger } from '@utils'
import { Job } from 'bull'

export interface BaseQueueJob {
  failedTaskId?: string
  queueName: string
}

export interface IntegrationQueueJob extends BaseQueueJob {
  formId: string
  integrationId: string
  submissionId: string
}

export class BaseQueue {
  logger!: Logger

  constructor(protected readonly failedTaskService: FailedTaskService) {
    this.logger = new Logger('Queue')
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.info(`${job.queue.name}#${job.id} started`)
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.info(`${job.queue.name}#${job.id} completed`)
  }

  @OnQueueFailed()
  async onFailed(job: Job) {
    this.logger.info(
      `${job.queue.name}#${job.id} failed, attempts ${job.attemptsMade} of ${job.opts.attempts} times`
    )

    if (job.attemptsMade >= job.opts.attempts) {
      if (job.data.failedTaskId) {
        await this.failedTaskService.discard(
          job.data.failedTaskId,
          job.failedReason
        )
      } else {
        await this.failedTaskService.create({
          data: job.data,
          failedReason: job.failedReason
        })
      }

      await job.discard()
    }
  }
}
