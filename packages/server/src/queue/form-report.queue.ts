import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { FormReportService } from '@service'

import { BaseQueue } from './base.queue'

interface FormReportQueueJob {
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
