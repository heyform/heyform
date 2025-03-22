/**
 * @program: servers
 * @description: Lark Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService, PlunkService } from '@service'
import { Job } from 'bull'
import { BaseQueue, BaseQueueJob } from './base.queue'

export interface PlunkQueueJob extends BaseQueueJob {
  type: 'createContact' | 'trackEvent'
  email: string
  event?: string
  data: Record<string, any>
}

@Processor('PlunkQueue')
export class PlunkQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly plunkService: PlunkService
  ) {
    super(failedTaskService)
  }

  @Process()
  async processor(job: Job<PlunkQueueJob>): Promise<any> {
    const { type, email, event, data } = job.data

    switch (type) {
      case 'createContact':
        await this.plunkService.createContact(email, data)
        return this.plunkService.trackEvent(email, 'user-signup', data)

      case 'trackEvent':
        return this.plunkService.trackEvent(email, event!, data)
    }
  }
}
