import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum IntegrationStatusEnum {
  ACTIVE = 1,
  DISABLED
}

interface EmailAttribute {
  email: string
}

// Lark, Legacy Slack webhook
interface WebhookAttribute {
  webhook: string
}

// Telegram chat ID
interface TelegramAttribute {
  chatId: string
}

interface GoogleAnalyticsAttribute {
  trackingCode: string
}

interface AirtableAttribute {
  apiKey: string
  base: string
  table: string
  fields: Array<Array<string | number | undefined>>
}

interface MailchimpAttribute {
  audience: {
    id: string
    name: string
  }
  group?: string
  tags?: string[]
  email: string
  fullName?: string
  address?: string
  phoneNumber?: string
}

interface GoogleDriveAttribute {
  drive: {
    id: string
    name: string
  }
  folder: {
    id: string
    name: string
  }
}

interface GoogleSheetsAttribute {
  drive: {
    id: string
    name: string
  }
  spreadsheet: {
    id: string
    name: string
  }
  worksheet: string
  fields: Array<string | number | undefined>
}

interface HubspotAttribute {
  fullname: string
  email: string
  phone?: string
  jobtitle?: string
}

interface MondayAttribute {
  board: {
    id: number
    name: string
    state: string
  }
  group: {
    id: number
    title: string
  }
  itemName: string
  fields?: Array<Array<string | number | undefined>>
}

interface GithubAttribute {
  organization: {
    login: string
    organization: boolean
  }
  repository: string
  assignee?: string
  label?: string
  milestone?: {
    title: string
    number: number
  }
  title: string
  body?: string
}

interface GitlabAttribute {
  server: string
  token: string
  group: {
    id: number
    name: string
  }
  project: {
    id: number
    name: string
  }
  label?: {
    id: number
    name: string
  }
  member?: {
    id: number
    name: string
  }
  milestone?: {
    id: number
    name: string
  }
  title: string
  body?: string
}

interface DropboxAttribute {
  folder: {
    id: string
    name: string
  }
}

@Schema({
  timestamps: true
})
export class IntegrationModel extends Document {
  @Prop({ required: true })
  formId: string

  @Prop({ required: true })
  appId: string

  @Prop({ type: Map, default: {} })
  attributes?:
    | EmailAttribute
    | WebhookAttribute
    | TelegramAttribute
    | GoogleAnalyticsAttribute
    | MailchimpAttribute
    | AirtableAttribute
    | GoogleDriveAttribute
    | GoogleSheetsAttribute
    | HubspotAttribute
    | MondayAttribute
    | GithubAttribute
    | GitlabAttribute
    | DropboxAttribute

  @Prop()
  thirdPartyOauthId?: string

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(IntegrationStatusEnum),
    default: IntegrationStatusEnum.ACTIVE
  })
  status: IntegrationStatusEnum
}

export const IntegrationSchema = SchemaFactory.createForClass(IntegrationModel)

IntegrationSchema.index({ formId: 1, appId: 1 }, { unique: true })
