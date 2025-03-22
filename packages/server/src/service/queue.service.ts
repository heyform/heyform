/**
 * @program: servers
 * @description: Queue Service
 * @author: Mufeng
 * @date: 2021-06-17 12:45
 **/

import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { JobOptions, Queue } from 'bull'
import { EspoCRMQueuePayload } from '../queue/espocrm.queue'

@Injectable()
export class QueueService {
  constructor(
    // Integrations
    @InjectQueue('AirtableQueue') private readonly airtableQueue: Queue,
    @InjectQueue('EmailQueue') private readonly emailQueue: Queue,
    @InjectQueue('GithubQueue') private readonly githubQueue: Queue,
    @InjectQueue('GitlabQueue') private readonly gitlabQueue: Queue,
    @InjectQueue('GoogleDriveQueue') private readonly googleDriveQueue: Queue,
    @InjectQueue('GoogleSheetsQueue') private readonly googleSheetsQueue: Queue,
    @InjectQueue('HubspotQueue') private readonly hubspotQueue: Queue,
    @InjectQueue('LarkQueue') private readonly larkQueue: Queue,
    @InjectQueue('LegacySlackQueue') private readonly legacySlackQueue: Queue,
    @InjectQueue('MailchimpQueue') private readonly mailchimpQueue: Queue,
    @InjectQueue('MondayQueue') private readonly mondayQueue: Queue,
    @InjectQueue('SendyQueue') private readonly sendyQueue: Queue,
    @InjectQueue('SupportpalQueue') private readonly supportpalQueue: Queue,
    @InjectQueue('TelegramQueue') private readonly telegramQueue: Queue,
    @InjectQueue('WebhookQueue') private readonly webhookQueue: Queue,
    @InjectQueue('DropboxQueue') private readonly dropboxQueue: Queue,
    // Add at Dec 27, 2021 (v2021.12.4)
    @InjectQueue('ExportTeamDataQueue')
    private readonly ExportTeamDataQueue: Queue,
    // Add at Mar 16, 2022 (v2022.3.1)
    @InjectQueue('EspoCRMQueue')
    private readonly EspoCRMQueue: Queue,
    // Add at Jul 15, 2022 (v2022.7.2)
    @InjectQueue('OsticketQueue')
    private readonly OsticketQueue: Queue,
    // Add at Jul 6, 2024
    @InjectQueue('SlackQueue')
    private readonly SlackQueue: Queue,
    // Add at Sep 20, 2024
    @InjectQueue('NotionQueue')
    private readonly NotionQueue: Queue
  ) {}

  addAirtableQueue(integrationId: string, submissionId: string) {
    this.airtableQueue.add({
      queueName: 'AirtableQueue',
      integrationId,
      submissionId
    })
  }

  addEmailQueue(formId: string, submissionId: string) {
    this.emailQueue.add({
      queueName: 'EmailQueue',
      formId,
      submissionId
    })
  }

  addGithubQueue(integrationId: string, submissionId: string) {
    this.githubQueue.add({
      queueName: 'GithubQueue',
      integrationId,
      submissionId
    })
  }

  addGitlabQueue(integrationId: string, submissionId: string) {
    this.gitlabQueue.add({
      queueName: 'GitlabQueue',
      integrationId,
      submissionId
    })
  }

  addGoogleDriveQueue(integrationId: string, submissionId: string) {
    this.googleDriveQueue.add({
      queueName: 'GoogleDriveQueue',
      integrationId,
      submissionId
    })
  }

  addGoogleSheetsQueue(integrationId: string, submissionId: string) {
    this.googleSheetsQueue.add({
      queueName: 'GoogleSheetsQueue',
      integrationId,
      submissionId
    })
  }

  addHubspotQueue(integrationId: string, submissionId: string) {
    this.hubspotQueue.add({
      queueName: 'HubspotQueue',
      integrationId,
      submissionId
    })
  }

  addLarkQueue(integrationId: string, submissionId: string) {
    this.larkQueue.add({
      queueName: 'LarkQueue',
      integrationId,
      submissionId
    })
  }

  addLegacySlackQueue(integrationId: string, submissionId: string) {
    this.legacySlackQueue.add({
      queueName: 'LegacySlackQueue',
      integrationId,
      submissionId
    })
  }

  addMailchimpQueue(integrationId: string, submissionId: string) {
    this.mailchimpQueue.add({
      queueName: 'MailchimpQueue',
      integrationId,
      submissionId
    })
  }

  addMondayQueue(integrationId: string, submissionId: string) {
    this.mondayQueue.add({
      queueName: 'MondayQueue',
      integrationId,
      submissionId
    })
  }

  addSendyQueue(email: string) {
    this.sendyQueue.add({
      queueName: 'SendyQueue',
      email
    })
  }

  addSupportpalQueue(integrationId: string, submissionId: string) {
    this.supportpalQueue.add({
      queueName: 'SupportpalQueue',
      integrationId,
      submissionId
    })
  }

  addTelegramQueue(integrationId: string, submissionId: string) {
    this.telegramQueue.add({
      queueName: 'TelegramQueue',
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

  addDropboxQueue(integrationId: string, submissionId: string) {
    this.dropboxQueue.add({
      queueName: 'DropboxQueue',
      integrationId,
      submissionId
    })
  }

  // Add at Dec 27, 2021 (v2021.12.4)
  addExportTeamDataQueue(teamId: string) {
    this.ExportTeamDataQueue.add({
      queueName: 'ExportTeamDataQueue',
      teamId
    })
  }

  // Add at Mar 16, 2022 (v2022.3.1)
  addEspoCRMQueue(payload: EspoCRMQueuePayload, options?: JobOptions) {
    this.EspoCRMQueue.add(
      {
        queueName: 'EspoCRMQueue',
        payload
      },
      options
    )
  }

  // Add at Jul 15, 2022 (v2022.7.2)
  addOsticketQueue(integrationId: string, submissionId: string) {
    this.OsticketQueue.add({
      queueName: 'OsticketQueue',
      integrationId,
      submissionId
    })
  }

  // Add at Jul 15, 2022 (v2022.7.2)
  addSlackQueue(integrationId: string, submissionId: string) {
    this.SlackQueue.add({
      queueName: 'SlackQueue',
      integrationId,
      submissionId
    })
  }

  // Add at Sep 20, 2024
  addNotionQueue(integrationId: string, submissionId: string) {
    this.NotionQueue.add({
      queueName: 'NotionQueue',
      integrationId,
      submissionId
    })
  }
}
