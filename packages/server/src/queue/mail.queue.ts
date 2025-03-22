import { SmtpOptionsFactory } from '@config'
import {
  SmtpMessage,
  SmtpOptions,
  smtpSendMail
} from '@heyforms/nestjs'
import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService } from '@service'
import { Job } from 'bull'
import { BaseQueue, BaseQueueJob } from './base.queue'

export interface MailQueueJob extends BaseQueueJob {
  data: SmtpMessage
}

@Processor('MailQueue')
export class MailQueue extends BaseQueue {
  private readonly options!: SmtpOptions

  constructor(failedTaskService: FailedTaskService) {
    super(failedTaskService)
    this.options = SmtpOptionsFactory()
  }

  @Process()
  async sendMail(job: Job<MailQueueJob>) {
    return smtpSendMail(this.options, job.data.data)
  }
}
