import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService } from '@service'
import { BaseQueue } from '../queue/base.queue'

@Processor('ResumeFailedTaskSchedule')
export class ResumeFailedTaskSchedule extends BaseQueue {
  constructor(failedTaskService: FailedTaskService) {
    super(failedTaskService)
  }

  @Process()
  async resumeFailedTask() {
    const num = await this.failedTaskService.resumeTasks()
    this.logger.info(`resuming ${num} failed tasks`)
  }
}
