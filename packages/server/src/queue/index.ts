import { BullModule } from '@nestjs/bull'

import { BullOptionsFactory } from '@config'

import { EmailQueue } from './email.queue'
import { FormReportQueue } from './form-report.queue'
import { MailQueue } from './mail.queue'
import { WebhookQueue } from './webhook.queue'

export const QueueProviders = {
  EmailQueue,
  FormReportQueue,
  MailQueue,
  WebhookQueue
}

export const QueueModules = Object.keys(QueueProviders).map(queueName => {
  return BullModule.registerQueueAsync({
    name: queueName,
    useFactory: BullOptionsFactory
  })
})
