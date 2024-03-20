import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { FormReportService } from '@service'

import { BaseQueue, BaseQueueJob } from './base.queue'

interface FormReportQueueJob extends BaseQueueJob {
  formId: string
}

@Processor('FormReportQueue')
export class FormReportQueue extends BaseQueue {
  constructor(private readonly formReportService: FormReportService) {
    super()
  }

  @Process()
  async generateReport(job: Job<FormReportQueueJob>): Promise<any> {
    const { formId } = job.data
    await this.formReportService.generate(formId)
  }
}
