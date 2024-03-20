import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bull'

@Injectable()
export class QueueService {
  constructor(
    // Integrations
    @InjectQueue('EmailQueue') private readonly emailQueue: Queue,
    @InjectQueue('WebhookQueue') private readonly webhookQueue: Queue
  ) {}

  addEmailQueue(integrationId: string, submissionId: string) {
    this.emailQueue.add({
      queueName: 'EmailQueue',
      integrationId,
      submissionId
    })
  }

  addWebhookQueue(integrationId: string, submissionId: string) {
    this.webhookQueue.add({
      queueName: 'WebhookQueue',
      integrationId,
      submissionId
    })
  }
}
