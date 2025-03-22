/**
 * @program: servers
 * @description: Integration Graphql
 * @author:
 * @date: 2021-06-15 10:29
 **/

import { IntegrationStatusEnum } from '@model'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUrl,
  Matches
} from 'class-validator'
import GraphQLJSON from 'graphql-type-json'
import { FormDetailInput } from './form.graphql'

@InputType()
export class ThirdPartyInput extends FormDetailInput {
  @Field()
  appId: string
}

@InputType()
export class ThirdPartyOAuthInput extends ThirdPartyInput {
  @Field()
  code: string
}

@InputType()
export class GoogleFileInput {
  @Field({ nullable: true })
  @IsOptional()
  id?: string

  @Field()
  name: string

  @Field({ nullable: true })
  webViewLink?: string
}

@InputType()
export class MailchimpAudienceInput {
  @Field()
  id: string

  @Field()
  name: string
}

@InputType()
class GoogleDriveSettingsInput {
  @Field(type => GoogleFileInput)
  drive: GoogleFileInput

  @Field(type => GoogleFileInput)
  folder: GoogleFileInput
}

@InputType()
class GoogleSheetsSettingsInput {
  @Field(type => GoogleFileInput)
  drive: GoogleFileInput

  @Field(type => GoogleFileInput)
  spreadsheet: GoogleFileInput

  @Field()
  worksheet: string

  @Field(type => GraphQLJSON)
  @IsArray()
  fields: Array<Array<string | number>>
}

@InputType()
class MailchimpSettingsInput {
  @Field(type => MailchimpAudienceInput)
  audience: MailchimpAudienceInput

  @Field({ nullable: true })
  @IsOptional()
  group?: string

  @Field(type => [String], { nullable: true })
  @IsOptional()
  tags?: string[]

  @Field()
  @IsEmail()
  email: string

  @Field({ nullable: true })
  @IsOptional()
  fullName?: string

  @Field({ nullable: true })
  @IsOptional()
  address?: string

  @Field({ nullable: true })
  @IsOptional()
  phoneNumber?: string
}

@InputType()
class AirtableBaseInput {
  @Field()
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  @IsOptional()
  permissionLevel?: string
}

@InputType()
class AirtableTableFieldInput {
  @Field()
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  @IsOptional()
  type?: string
}

@InputType()
class AirtableTableInput {
  @Field()
  id: string

  @Field()
  name: string

  @Field(type => [AirtableTableFieldInput])
  fields: AirtableTableFieldInput[]
}

@InputType()
export class AirtableTablesInput extends ThirdPartyInput {
  @Field()
  baseId: string
}

@InputType()
class AirtableSettingsInput {
  @Field(type => AirtableBaseInput)
  base: AirtableBaseInput

  @Field(type => AirtableTableInput)
  table: AirtableBaseInput

  @Field(type => GraphQLJSON)
  @IsArray()
  fields: Array<Array<string | number>>
}

@InputType()
class NotionDatabaseInput {
  @Field()
  id: string

  @Field()
  name: string

  @Field(type => GraphQLJSON)
  @IsArray()
  fields: Array<Record<string, any>>
}

@InputType()
class NotionSettingsInput {
  @Field(type => NotionDatabaseInput)
  database: NotionDatabaseInput

  @Field(type => GraphQLJSON)
  @IsArray()
  fields: Array<Array<string | number>>
}

@InputType()
class SlackChannelInput {
  @Field()
  id: string

  @Field()
  name: string
}

@InputType()
class SlackSettingsInput {
  @Field(type => SlackChannelInput)
  channel: SlackChannelInput
}

@InputType()
class EmailSettingsInput {
  @Field()
  @IsEmail()
  email: string
}

@InputType()
class GoogleAnalyticsSettingsInput {
  @Field()
  trackingCode: string
}

@InputType()
class LarkSettingsInput {
  @Field()
  @IsUrl()
  @Matches(/^https:\/\/open.feishu.cn\/open-apis\/bot\//)
  webhook: string
}

@InputType()
class LegacySlackSettingsInput {
  @Field()
  @IsUrl()
  @Matches(/^https:\/\/hooks.slack.com\/services\//)
  webhook: string
}

@InputType()
class TelegramSettingsInput {
  @Field()
  @Matches(/^-?\d+$/)
  chatId: string
}

@InputType()
class HubspotSettingsInput {
  @Field()
  fullname: string

  @Field()
  email: string

  @Field({ nullable: true })
  phone?: string

  @Field({ nullable: true })
  jobtitle?: string
}

@InputType()
export class MondayBoardInput {
  @Field()
  id: number

  @Field()
  name: string

  @Field()
  state: string
}

@InputType()
export class MondayGroupInput {
  @Field()
  id: string

  @Field()
  title: string
}

@InputType()
class MondaySettingsInput {
  @Field(type => MondayBoardInput)
  board: MondayBoardInput

  @Field(type => MondayGroupInput, { nullable: true })
  group?: MondayGroupInput

  @Field()
  itemName: string

  @Field(type => GraphQLJSON, { nullable: true })
  @IsArray()
  @IsOptional()
  fields?: Array<Array<string | number>>
}

@InputType()
export class SupportPalValueInput {
  @Field()
  id: number

  @Field()
  name: string
}

@InputType()
class SupportpalSettingsInput {
  @Field()
  systemURL: string

  @Field()
  token: string

  @Field(type => SupportPalValueInput)
  department: SupportPalValueInput

  @Field(type => SupportPalValueInput)
  priority: SupportPalValueInput

  @Field({ nullable: true })
  userName?: string

  @Field({ nullable: true })
  email?: string

  @Field()
  subject: string

  @Field()
  text: string

  @Field(type => SupportPalValueInput)
  status: SupportPalValueInput
}

@InputType()
class GithubMilestoneInput {
  @Field()
  title: string

  @Field()
  number: number
}

@InputType()
class GithubOrganizationInput {
  @Field()
  login: string

  @Field()
  organization: boolean
}

@InputType()
class GithubSettingsInput {
  @Field(type => GithubOrganizationInput)
  organization: GithubOrganizationInput

  @Field()
  repository: string

  @Field({ nullable: true })
  assignee?: string

  @Field({ nullable: true })
  label?: string

  @Field(type => GithubMilestoneInput, { nullable: true })
  milestone?: GithubMilestoneInput

  @Field()
  title: string

  @Field({ nullable: true })
  body?: string
}

@InputType()
export class GitlabResultInput {
  @Field()
  id: number

  @Field()
  name: string
}

@InputType()
class GitlabSettingsInput {
  @Field()
  @IsUrl()
  server: string

  @Field()
  token: string

  @Field(type => GitlabResultInput)
  group: GitlabResultInput

  @Field(type => GitlabResultInput)
  project: GitlabResultInput

  @Field(type => GitlabResultInput, { nullable: true })
  @IsOptional()
  label?: GitlabResultInput

  @Field(type => GitlabResultInput, { nullable: true })
  @IsOptional()
  member?: GitlabResultInput

  @Field(type => GitlabResultInput, { nullable: true })
  @IsOptional()
  milestone?: GitlabResultInput

  @Field()
  title: string

  @Field({ nullable: true })
  body?: string
}

@InputType()
class WebhookSettingsInput {
  @Field()
  @IsUrl()
  webhook: string
}

@InputType()
class DropboxFolderInput {
  @Field()
  id: string

  @Field()
  name: string
}

@InputType()
class DropboxSettingsInput {
  @Field(type => DropboxFolderInput)
  folder: DropboxFolderInput
}

@InputType()
class OsticketSettingsInput {
  @Field()
  serverURL: string

  @Field()
  apiKey: string

  @Field()
  name: string

  @Field()
  email: string

  @Field({ nullable: true })
  phone: string

  @Field()
  subject: string

  @Field()
  message: string
}

@InputType()
export class UpdateIntegrationInput extends ThirdPartyInput {
  @Field(type => GoogleDriveSettingsInput, { nullable: true })
  @IsOptional()
  googledrive?: GoogleDriveSettingsInput

  @Field(type => GoogleSheetsSettingsInput, { nullable: true })
  @IsOptional()
  googlesheets?: GoogleSheetsSettingsInput

  @Field(type => MailchimpSettingsInput, { nullable: true })
  @IsOptional()
  mailchimp?: MailchimpSettingsInput

  @Field(type => AirtableSettingsInput, { nullable: true })
  @IsOptional()
  airtable?: AirtableSettingsInput

  @Field(type => EmailSettingsInput, { nullable: true })
  @IsOptional()
  email?: EmailSettingsInput

  @Field(type => GoogleAnalyticsSettingsInput, { nullable: true })
  @IsOptional()
  googleanalytics?: GoogleAnalyticsSettingsInput

  @Field(type => LarkSettingsInput, { nullable: true })
  @IsOptional()
  lark?: LarkSettingsInput

  @Field(type => LegacySlackSettingsInput, { nullable: true })
  @IsOptional()
  legacyslack?: LegacySlackSettingsInput

  @Field(type => SlackSettingsInput, { nullable: true })
  @IsOptional()
  slack?: SlackSettingsInput

  @Field(type => TelegramSettingsInput, { nullable: true })
  @IsOptional()
  telegram?: TelegramSettingsInput

  @Field(type => GoogleAnalyticsSettingsInput, { nullable: true })
  @IsOptional()
  facebookpixel?: GoogleAnalyticsSettingsInput

  @Field(type => HubspotSettingsInput, { nullable: true })
  @IsOptional()
  hubspot?: HubspotSettingsInput

  @Field(type => MondaySettingsInput, { nullable: true })
  @IsOptional()
  monday?: MondaySettingsInput

  @Field(type => SupportpalSettingsInput, { nullable: true })
  @IsOptional()
  supportpal?: SupportpalSettingsInput

  @Field(type => GithubSettingsInput, { nullable: true })
  @IsOptional()
  github?: GithubSettingsInput

  @Field(type => GitlabSettingsInput, { nullable: true })
  @IsOptional()
  gitlab?: GitlabSettingsInput

  @Field(type => WebhookSettingsInput, { nullable: true })
  @IsOptional()
  webhook?: WebhookSettingsInput

  @Field(type => DropboxSettingsInput, { nullable: true })
  @IsOptional()
  dropbox?: DropboxSettingsInput

  @Field(type => OsticketSettingsInput, { nullable: true })
  @IsOptional()
  osticket?: OsticketSettingsInput

  @Field(type => NotionSettingsInput, { nullable: true })
  @IsOptional()
  notion?: NotionSettingsInput
}

@InputType()
export class UpdateIntegrationStatusInput extends ThirdPartyInput {
  @Field(type => Number)
  @IsEnum(IntegrationStatusEnum)
  status: IntegrationStatusEnum
}

@ObjectType()
export class AirtableBaseType {
  @Field()
  id: string

  @Field()
  name: string

  @Field()
  permissionLevel: string
}

@ObjectType()
class AirtableTableFieldType {
  @Field()
  id: string

  @Field()
  name: string

  @Field()
  type: string
}

@ObjectType()
export class AirtableTablesType {
  @Field()
  id: string

  @Field()
  name: string

  @Field(type => [AirtableTableFieldType])
  fields: AirtableTableFieldType[]
}

@ObjectType()
export class SlackChannelType {
  @Field()
  id: string

  @Field()
  name: string
}

@InputType()
export class GoogleDriveFoldersInput extends ThirdPartyInput {
  @Field({ nullable: true })
  drive?: string
}

@InputType()
export class GoogleSheetsWorksheetsInput extends ThirdPartyInput {
  @Field({ nullable: true })
  spreadsheet: string
}

@InputType()
export class GoogleSheetsFieldsInput extends GoogleSheetsWorksheetsInput {
  @Field({ nullable: true })
  worksheet: string
}

@InputType()
export class MondayGroupsInput extends ThirdPartyInput {
  @Field({ nullable: true })
  board: number
}

@ObjectType()
export class GoogleDriveType {
  @Field()
  id: string

  @Field()
  name: string
}

@ObjectType()
export class GoogleDriveFileType extends GoogleDriveType {
  @Field({ nullable: true })
  webViewLink?: string
}

@ObjectType()
export class MailchimpAudienceType {
  @Field()
  id: string

  @Field()
  name: string
}

@ObjectType()
export class MondayBoardType {
  @Field()
  id: number

  @Field()
  name: string

  @Field()
  state: string
}

@ObjectType()
export class MondayGroupType {
  @Field()
  id: string

  @Field()
  title: string
}

@ObjectType()
export class MondayFieldType {
  @Field()
  id: string

  @Field()
  title: string

  @Field()
  type: string
}

@InputType()
export class SupportPalInput extends FormDetailInput {
  @Field()
  systemURL: string

  @Field()
  token: string
}

@InputType()
export class SupportPalPrioritiesInput extends SupportPalInput {
  @Field()
  departmentId: number
}

@ObjectType()
export class SupportPalType {
  @Field()
  id: number

  @Field()
  name: string
}

@InputType()
export class GithubAssigneesInput extends ThirdPartyInput {
  @Field()
  repository: string
}

@InputType()
export class GithubRepositoriesInput extends ThirdPartyInput {
  @Field()
  login: string

  @Field()
  organization: boolean
}

@ObjectType()
export class GithubOrganizationType {
  @Field()
  login: string

  @Field()
  organization: boolean
}

@ObjectType()
export class GithubMilestoneType {
  @Field()
  title: string

  @Field()
  number: number
}

@InputType()
export class GitlabInput extends FormDetailInput {
  @Field()
  server: string

  @Field()
  token: string
}

@InputType()
export class GitlabProjectsInput extends GitlabInput {
  @Field()
  group: number
}

@InputType()
export class GitlabMembersInput extends GitlabInput {
  @Field()
  project: number
}

@ObjectType()
export class GitlabType {
  @Field()
  id: number

  @Field()
  name: string
}
