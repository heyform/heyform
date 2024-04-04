import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { SmtpOptionsFactory } from '@config'
import { SmtpMessage, SmtpOptions, smtpSendMail } from '@utils'

import { BaseQueue } from './base.queue'

export interface MailQueueJob {
  data: SmtpMessage
}

@Processor('MailQueue')
export class MailQueue extends BaseQueue {
  private readonly options!: SmtpOptions

  constructor() {
    super()
    this.options = SmtpOptionsFactory()
  }

  @Process()
  async sendMail(job: Job<MailQueueJob>) {
    return smtpSendMail(this.options, job.data.data)
  }
}
