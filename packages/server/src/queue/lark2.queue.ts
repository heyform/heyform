import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import got from 'got'

import { BaseQueue, BaseQueueJob } from './base.queue'
import { FailedTaskService } from '@service'

export interface Lark2QueueJob extends BaseQueueJob {
  webhookUrl: string
  message: {
    msg_type: string
    content: any
  }
}

@Processor('Lark2Queue')
export class Lark2Queue extends BaseQueue {
  constructor(failedTaskService: FailedTaskService) {
    super(failedTaskService)
  }

  @Process()
  async handler(job: Job<Lark2QueueJob>) {
    const { webhookUrl, message } = job.data

    return got
      .post(webhookUrl, {
        json: message,
        timeout: 60_000
      })
      .json()
  }
}
