import { OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull'
import { Job } from 'bull'

import { Logger } from '@utils'

export interface IntegrationQueueJob {
  integrationId: string
  submissionId: string
}

export class BaseQueue {
  logger!: Logger

  constructor() {
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
      await job.discard()
    }
  }
}
