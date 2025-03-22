import { BullOptionsFactory } from '@config'
import { BullModule } from '@nestjs/bull'
import { AirtableQueue } from './airtable.queue'
import { DropboxQueue } from './dropbox.queue'
import { EmailQueue } from './email.queue'
import { EspoCRMQueue } from './espocrm.queue'
import { ExportTeamDataQueue } from './export-team-data.queue'
import { FormReportQueue } from './form-report.queue'
import { GithubQueue } from './github.queue'
import { GitlabQueue } from './gitlab.queue'
import { GoogleDriveQueue } from './google-drive.queue'
import { GoogleSheetsQueue } from './google-sheets.queue'
import { HubspotQueue } from './hubspot.queue'
import { LarkQueue } from './lark.queue'
import { LegacySlackQueue } from './legacy-slack.queue'
import { MailQueue } from './mail.queue'
import { MailchimpQueue } from './mailchimp.queue'
import { MondayQueue } from './monday.queue'
import { OsticketQueue } from './osticket.queue'
import { SendyQueue } from './sendy.queue'
import { SupportpalQueue } from './supportpal.queue'
import { TelegramQueue } from './telegram.queue'
import { WebhookQueue } from './webhook.queue'
import { Lark2Queue } from './lark2.queue'
import { TranslateFormQueue } from './translate-form.queue'
import { SlackQueue } from './slack.queue'
import { PlunkQueue } from './plunk.queue'
import { NotionQueue } from './notion.queue'

export const QueueProviders = {
  AirtableQueue,
  EmailQueue,
  FormReportQueue,
  GoogleDriveQueue,
  GoogleSheetsQueue,
  HubspotQueue,
  LarkQueue,
  LegacySlackQueue,
  MailQueue,
  MailchimpQueue,
  MondayQueue,
  SendyQueue,
  TelegramQueue,
  SupportpalQueue,
  GithubQueue,
  GitlabQueue,
  WebhookQueue,
  DropboxQueue,
  // Add at Dec 27, 2021 (v2021.12.4)
  ExportTeamDataQueue,
  // Add at Mar 16, 2022 (v2022.3.1)
  EspoCRMQueue,
  // Add at Jul 15, 2022 (v2022.7.2)
  OsticketQueue,
  // Add at Jan 7, 2024 (v2023.1.2)
  Lark2Queue,
  // Add at Jul 6, 2024
  SlackQueue,
  TranslateFormQueue,
  // Add at Jul 9, 2024
  PlunkQueue,
  // Add at Sep 20, 2024
  NotionQueue
}

export const QueueModules = Object.keys(QueueProviders).map(queueName => {
  return BullModule.registerQueueAsync({
    name: queueName,
    useFactory: BullOptionsFactory
  })
})
