/**
 * Created by mufeng on 2021/05/20.
 * Copyright (c) 2021 Heyooo, Inc. all rights reserved
 */
import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService, FormReportService } from '@service'
import { Job } from 'bull'
import { BaseQueue, BaseQueueJob } from './base.queue'

interface FormReportQueueJob extends BaseQueueJob {
  formId: string
}

@Processor('FormReportQueue')
export class FormReportQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly formReportService: FormReportService
  ) {
    super(failedTaskService)
  }

  @Process()
  async generateReport(job: Job<FormReportQueueJob>): Promise<any> {
    const { formId } = job.data
    await this.formReportService.generate(formId)
  }
}
