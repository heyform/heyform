import { Process, Processor } from '@nestjs/bull'
import { AppService, FailedTaskService } from '@service'
import { BaseQueue } from '../queue/base.queue'

@Processor('ExpiredAppCodeTokenSchedule')
export class ExpiredAppCodeTokenSchedule extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly appService: AppService
  ) {
    super(failedTaskService)
  }

  @Process()
  async expiredAppCodeToken(): Promise<any> {
    await this.appService.deleteExpiredCodes()
  }
}
