/**
 * @program: servers
 * @description: Sendy Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { Sendy } from '@heyforms/integrations'
import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService } from '@service'
import { Job } from 'bull'
import { BaseQueue, BaseQueueJob } from './base.queue'
import {
  SENDY_API_KEY,
  SENDY_API_URL,
  SENDY_SUBSCRIBE_LIST
} from '@environments'

interface SendyQueueJob extends BaseQueueJob {
  email: string
}

@Processor('SendyQueue')
export class SendyQueue extends BaseQueue {
  constructor(failedTaskService: FailedTaskService) {
    super(failedTaskService)
  }

  @Process()
  async createRecord(job: Job<SendyQueueJob>): Promise<any> {
    const sendy = Sendy.init({
      server: SENDY_API_URL,
      clientSecret: SENDY_API_KEY
    })
    await sendy.subscribe(SENDY_SUBSCRIBE_LIST, job.data.email)
  }
}
