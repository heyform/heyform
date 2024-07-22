import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsArray, IsEnum, IsIn, IsOptional, IsUrl, Max, Min } from 'class-validator'
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json'

import {
  ActionEnum,
  CalculateEnum,
  CaptchaKindEnum,
  Choice,
  Column,
  ComparisonEnum,
  FieldKindEnum,
  FieldLayoutAlignEnum,
  FormField,
  FormKindEnum,
  FormSettings,
  FormStatusEnum,
  HiddenField,
  InteractiveModeEnum,
  Layout,
  Logic,
  LogicAction,
  LogicCondition,
  LogicPayload,
  Property,
  Validation,
  Variable
} from '@heyform-inc/shared-types-enums'

import { FormModel, IntegrationStatusEnum } from '@model'

@InputType()
class ChoiceInput {
  @Field()
  id: string

  @Field()
  label: string

  @Field({ nullable: true })
  image?: string

  @Field({ nullable: true })
  color?: string

  @Field({ nullable: true })
  score?: number

  @Field({ nullable: true })
  isExpected?: boolean
}

@InputType()
class ColumnInput {
  @Field()
  id: string

  @Field()
  label: string

  @Field({ nullable: true })
  type?: string

  @Field({ nullable: true })
  required?: boolean
}

@InputType()
class PricePropertyInput {
  @Field()
  type: string

  @Field({ nullable: true })
  value?: number

  @Field({ nullable: true })
  ref?: string
}

@InputType()
class SharedPropertyInput {
  @Field({ nullable: true })
  showButton?: boolean

  @Field({ nullable: true })
  buttonText?: string

  @Field({ nullable: true })
  hideMarks?: boolean

  @Field({ nullable: true })
  allowOther?: boolean

  @Field({ nullable: true })
  allowMultiple?: boolean

  @Field(type => [ChoiceInput], { nullable: true })
  choices?: Choice[]

  @Field({ nullable: true })
  randomize?: boolean

  @Field({ nullable: true })
  choiceStyle?: string

  @Field({ nullable: true })
  other?: string

  @Field({ nullable: true })
  numberPreRow?: number

  @Field({ nullable: true })
  shape?: string

  @Field({ nullable: true })
  total?: number

  @Field({ nullable: true })
  start?: number

  @Field({ nullable: true })
  leftLabel?: string

  @Field({ nullable: true })
  centerLabel?: string

  @Field({ nullable: true })
  rightLabel?: string

  @Field({ nullable: true })
  defaultCountryCode?: string

  @Field({ nullable: true })
  currency?: string

  @Field(type => PricePropertyInput, { nullable: true })
  price?: PricePropertyInput

  @Field({ nullable: true })
  format?: string

  @Field({ nullable: true })
  allowTime?: boolean

  @Field({ nullable: true })
  use12Hours?: boolean

  @Field(type => [ColumnInput], { nullable: true })
  tableColumns?: Column[]

  @Field({ nullable: true })
  score?: number

  @Field({ nullable: true })
  @IsUrl()
  sourceUrl?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  buttonLinkUrl?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  redirectUrl?: string

  @Field({ nullable: true })
  @IsOptional()
  redirectOnCompletion?: boolean
}

@InputType()
export class PropertyInput extends SharedPropertyInput {
  @Field(type => [FormChildFieldInput], { nullable: true })
  fields?: FormField[]
}

@InputType()
class ValidationInput {
  @Field({ nullable: true })
  required?: boolean

  @Field({ nullable: true })
  min?: number

  @Field({ nullable: true })
  max?: number

  @Field({ nullable: true })
  matchExpected?: boolean
}

@InputType()
class LayoutInput {
  @Field({ nullable: true })
  @IsIn(['image', 'video'])
  mediaType?: string

  @Field({ nullable: true })
  @IsUrl()
  mediaUrl?: string

  @Field({ nullable: true })
  backgroundColor?: string

  @Field({ nullable: true })
  @Min(-100)
  @Max(100)
  brightness?: number

  @Field({ nullable: true })
  @IsEnum(FieldLayoutAlignEnum)
  align?: FieldLayoutAlignEnum
}

@InputType()
class SharedFormFieldInput {
  @Field(type => GraphQLJSON, { nullable: true })
  title?: any[]

  @Field(type => GraphQLJSON, { nullable: true })
  description?: any[]

  @Field(type => String, { nullable: true })
  kind?: FieldKindEnum

  @Field(type => ValidationInput, { nullable: true })
  validations?: Validation

  @Field(type => SharedPropertyInput, { nullable: true })
  properties?: Property

  @Field({ nullable: true })
  width?: number

  @Field({ nullable: true })
  hide?: boolean

  @Field({ nullable: true })
  frozen?: boolean
}

@InputType()
class FormChildFieldInput extends SharedFormFieldInput {
  @Field()
  id: string

  @Field(type => String)
  kind: FieldKindEnum

  @Field(type => LayoutInput, { nullable: true })
  layout?: Layout
}

@InputType()
export class FormFieldInput extends SharedFormFieldInput {
  @Field()
  id: string

  @Field(type => String)
  kind: FieldKindEnum

  @Field(type => PropertyInput, { nullable: true })
  properties?: Property

  @Field(type => LayoutInput, { nullable: true })
  layout?: Layout
}

@InputType()
export class FormsInput {
  @Field()
  projectId: string

  @Field(type => Number)
  @IsEnum(Object.values(FormStatusEnum))
  status: FormStatusEnum

  @Field({ nullable: true })
  @IsOptional()
  keyword?: string
}

@InputType()
export class CreateFormInput {
  @Field()
  projectId: string

  @Field({ nullable: true })
  name?: string

  @Field(type => GraphQLJSON, { nullable: true })
  @IsArray()
  nameSchema?: any[]

  @Field(type => Number)
  @IsEnum(Object.values(InteractiveModeEnum))
  interactiveMode: InteractiveModeEnum

  @Field(type => Number)
  @IsEnum(Object.values(FormKindEnum))
  kind: FormKindEnum
}

@InputType()
export class FormDetailInput {
  @Field()
  formId: string
}

@InputType()
export class FormAnalyticInput extends FormDetailInput {
  // Form analytic range days
  @Field()
  @Min(7)
  @Max(365)
  range: number
}

@InputType()
export class UpdateFormInput extends FormDetailInput {
  @Field({ nullable: true })
  @IsOptional()
  name?: string

  @Field(type => Number, { nullable: true })
  @IsOptional()
  captchaKind?: CaptchaKindEnum

  @Field({ nullable: true })
  @IsOptional()
  active?: boolean

  @Field({ nullable: true })
  @IsOptional()
  enableExpirationDate?: boolean

  @Field({ nullable: true })
  @IsOptional()
  expirationTimeZone?: string

  @Field({ nullable: true })
  @IsOptional()
  @Min(0)
  enabledAt?: number

  @Field({ nullable: true })
  @IsOptional()
  @Min(0)
  closedAt?: number

  @Field({ nullable: true })
  @IsOptional()
  enableTimeLimit?: boolean

  @Field({ nullable: true })
  @IsOptional()
  @Min(0)
  timeLimit?: number

  @Field({ nullable: true })
  @IsOptional()
  published?: boolean

  @Field({ nullable: true })
  @IsOptional()
  filterSpam?: boolean

  @Field({ nullable: true })
  @IsOptional()
  password?: string

  @Field({ nullable: true })
  @IsOptional()
  requirePassword?: boolean

  @Field(type => [String], { nullable: true })
  @IsOptional()
  languages?: string[]

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  redirectUrl?: string

  @Field({ nullable: true })
  @IsOptional()
  redirectOnCompletion?: boolean

  @Field({ nullable: true })
  @IsOptional()
  enableQuotaLimit?: boolean

  @Field({ nullable: true })
  @IsOptional()
  @Min(1)
  quotaLimit?: number

  @Field({ nullable: true })
  @IsOptional()
  enableIpLimit?: boolean

  @Field({ nullable: true })
  @IsOptional()
  @Min(1)
  ipLimitCount?: number

  @Field({ nullable: true })
  @IsOptional()
  ipLimitTime?: number

  @Field({ nullable: true })
  @IsOptional()
  enableProgress?: boolean

  @Field({ nullable: true })
  @IsOptional()
  enableQuestionList?: boolean

  @Field({ nullable: true })
  @IsOptional()
  locale?: string

  @Field({ nullable: true })
  @IsOptional()
  enableClosedMessage?: boolean

  @Field({ nullable: true })
  @IsOptional()
  closedFormTitle?: string

  @Field({ nullable: true })
  @IsOptional()
  closedFormDescription?: string

  @Field({ nullable: true })
  @IsOptional()
  allowArchive?: boolean
}

@InputType()
export class UpdateFormArchiveInput extends FormDetailInput {
  @Field()
  allowArchive: boolean
}

@InputType()
class LogicConditionInput {
  @Field()
  @IsEnum(Object.values(ComparisonEnum))
  comparison: string

  @Field(type => GraphQLJSON, { nullable: true })
  expected?: any

  @Field({ nullable: true })
  ref?: string
}

@InputType()
class LogicActionInput {
  @Field()
  @IsEnum(Object.values(ActionEnum))
  kind: string

  @Field({ nullable: true })
  fieldId?: string

  @Field({ nullable: true })
  variable?: string

  @Field({ nullable: true })
  @IsEnum(Object.values(CalculateEnum))
  operator?: string

  @Field(type => GraphQLJSON, { nullable: true })
  value?: any

  @Field({ nullable: true })
  ref?: string
}

@InputType()
class LogicPayloadInput {
  @Field()
  id: string

  @Field(type => LogicConditionInput)
  condition: LogicCondition

  @Field(type => LogicActionInput)
  action: LogicAction
}

@InputType()
class LogicInput {
  @Field()
  fieldId: string

  @Field(type => [LogicPayloadInput])
  payloads: LogicPayload[]
}

@InputType()
export class UpdateFormLogicsInput extends FormDetailInput {
  @Field(type => [LogicInput])
  logics: Logic[]
}

@InputType()
class VariableInput {
  @Field()
  id: string

  @Field()
  name: string

  @Field()
  @IsEnum(['string', 'number'])
  kind: string

  @Field(type => GraphQLJSON)
  value: any
}

@InputType()
export class UpdateFormVariablesInput extends FormDetailInput {
  @Field(type => [VariableInput])
  variables: Variable[]
}

@InputType()
export class UpdateFormSchemasInput extends FormDetailInput {
  @Field(type => [FormFieldInput])
  @IsArray()
  fields: FormField[]
}

@InputType()
export class CreateFormFieldInput extends FormDetailInput {
  @Field(type => FormFieldInput)
  field: Record<string, any>
}

@InputType()
export class DeleteFormFieldInput extends FormDetailInput {
  @Field()
  fieldId: string
}

@InputType()
export class UpdateFormFieldInput extends DeleteFormFieldInput {
  @Field(type => SharedFormFieldInput)
  updates: Record<string, any>
}

@InputType()
export class DeleteHiddenFieldInput {
  @Field()
  formId: string

  @Field()
  fieldId: string
}

@InputType()
export class CreateHiddenFieldInput extends DeleteHiddenFieldInput {
  @Field()
  fieldName: string
}

@InputType()
export class FormThemeInput {
  @Field({ nullable: true })
  fontFamily?: string

  @Field({ nullable: true })
  questionTextColor?: string

  @Field({ nullable: true })
  answerTextColor?: string

  @Field({ nullable: true })
  buttonBackground?: string

  @Field({ nullable: true })
  buttonTextColor?: string

  @Field({ nullable: true })
  backgroundColor?: string

  @Field({ nullable: true })
  backgroundImage?: string

  @Field({ nullable: true })
  @Min(-100)
  @Max(100)
  backgroundBrightness?: number

  @Field({ nullable: true })
  logo?: string

  @Field({ nullable: true })
  customCSS?: string
}

@InputType()
export class UpdateFormThemeInput extends FormDetailInput {
  @Field(type => FormThemeInput)
  theme: FormThemeInput
}

@InputType()
export class SearchFormInput {
  @Field()
  keyword: string
}

@ObjectType()
export class ChoiceType {
  @Field()
  id: string

  @Field()
  label: string

  @Field({ nullable: true })
  image?: string

  @Field({ nullable: true })
  color?: string

  @Field({ nullable: true })
  score?: number

  @Field({ nullable: true })
  isExpected?: boolean
}

@ObjectType()
export class PropertyType {
  @Field({ nullable: true })
  showButton?: boolean

  @Field({ nullable: true })
  buttonText?: string

  @Field({ nullable: true })
  hideMarks?: boolean

  @Field({ nullable: true })
  allowOther?: boolean

  @Field({ nullable: true })
  allowMultiple?: boolean

  @Field(type => [ChoiceType], { nullable: true })
  choices?: Choice[]

  @Field({ nullable: true })
  other?: string

  @Field({ nullable: true })
  numberPreRow?: number

  @Field({ nullable: true })
  shape?: string

  @Field({ nullable: true })
  total?: number

  @Field({ nullable: true })
  start?: number

  @Field({ nullable: true })
  leftLabel?: string

  @Field({ nullable: true })
  centerLabel?: string

  @Field({ nullable: true })
  rightLabel?: string

  @Field({ nullable: true })
  defaultCountryCode?: string

  @Field({ nullable: true })
  currency?: string

  @Field({ nullable: true })
  price?: number

  @Field({ nullable: true })
  format?: string

  @Field({ nullable: true })
  use12Hours?: boolean

  @Field({ nullable: true })
  score?: number
}

@ObjectType()
export class ValidationType {
  @Field({ nullable: true })
  required?: boolean

  @Field({ nullable: true })
  min?: number

  @Field({ nullable: true })
  max?: number

  @Field({ nullable: true })
  matchExpected?: boolean
}

@ObjectType()
export class FormSettingType {
  @Field({ nullable: true })
  captchaKind?: number

  @Field({ nullable: true })
  active?: boolean

  @Field({ nullable: true })
  enableExpirationDate?: boolean

  @Field({ nullable: true })
  expirationTimeZone?: string

  @Field({ nullable: true })
  enabledAt?: number

  @Field({ nullable: true })
  closedAt?: number

  @Field({ nullable: true })
  enableTimeLimit?: boolean

  @Field({ nullable: true })
  timeLimit?: number

  @Field({ nullable: true })
  published?: boolean

  @Field({ nullable: true })
  filterSpam?: boolean

  @Field({ nullable: true })
  allowArchive?: boolean

  @Field({ nullable: true })
  password?: string

  @Field({ nullable: true })
  requirePassword?: boolean

  @Field({ nullable: true })
  redirectOnCompletion?: boolean

  @Field({ nullable: true })
  redirectUrl?: string

  @Field({ nullable: true })
  enableQuotaLimit?: boolean

  @Field({ nullable: true })
  quotaLimit?: number

  @Field({ nullable: true })
  enableIpLimit?: boolean

  @Field({ nullable: true })
  ipLimitCount?: number

  @Field({ nullable: true })
  ipLimitTime?: number

  @Field({ nullable: true })
  enableProgress?: boolean

  @Field({ nullable: true })
  enableQuestionList?: boolean

  @Field({ nullable: true })
  locale?: string

  @Field(type => [String], { nullable: true, defaultValue: [] })
  languages?: string[]

  @Field({ nullable: true })
  enableClosedMessage?: boolean

  @Field({ nullable: true })
  closedFormTitle?: string

  @Field({ nullable: true })
  closedFormDescription?: string
}

@ObjectType()
export class ThemeSettingsType {
  @Field(type => GraphQLJSONObject, { nullable: true })
  theme?: Record<string, any>
}

@ObjectType()
export class FormFieldType {
  @Field()
  id: string

  @Field(type => GraphQLJSON, { nullable: true })
  title?: any[]

  // Adapt to old version
  @Field(type => GraphQLJSON, { nullable: true })
  titleSchema?: any[]

  @Field(type => GraphQLJSON, { nullable: true })
  description?: any[]

  @Field(type => String)
  kind: FieldKindEnum

  @Field(type => GraphQLJSONObject, { nullable: true })
  validations?: Validation

  @Field(type => GraphQLJSONObject, { nullable: true })
  properties?: Property

  @Field(type => GraphQLJSONObject, { nullable: true })
  layout?: Layout

  @Field({ nullable: true })
  width?: number

  @Field({ nullable: true })
  hide?: boolean

  @Field({ nullable: true })
  frozen?: boolean
}

@ObjectType()
export class HiddenFieldType {
  @Field()
  id: string

  @Field()
  name: string
}

@ObjectType()
export class PageBackgroundType {
  @Field({ nullable: true })
  backgroundPosition?: string

  @Field({ nullable: true })
  backgroundColor?: string

  @Field({ nullable: true })
  backgroundImage?: string
}

@ObjectType()
class StripeAccountType {
  @Field()
  accountId: string

  @Field()
  email: string
}

@ObjectType()
export class FormType {
  @Field()
  id: string

  @Field({ nullable: true })
  teamId: string

  @Field()
  projectId: string

  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  interactiveMode: number

  @Field({ nullable: true })
  kind: number

  @Field({ nullable: true })
  memberId: string

  @Field(type => FormSettingType, { nullable: true })
  settings?: FormSettings

  @Field(type => [FormFieldType], { nullable: true })
  fields?: FormField[]

  @Field(type => [HiddenFieldType], { nullable: true })
  hiddenFields?: HiddenField[]

  @Field(type => [GraphQLJSONObject], { nullable: true })
  logics?: Logic[]

  @Field(type => [GraphQLJSONObject], { nullable: true })
  variables?: Variable[]

  @Field({ nullable: true })
  reversion: number

  @Field(type => StripeAccountType, { nullable: true })
  stripeAccount?: StripeAccountType

  @Field(type => ThemeSettingsType, { nullable: true })
  themeSettings?: ThemeSettingsType

  @Field({ nullable: true })
  fieldUpdateAt?: number

  @Field({ nullable: true })
  submissionCount?: number

  @Field({ nullable: true })
  retentionAt?: number

  @Field({ nullable: true })
  suspended?: boolean

  // HeyForm Form Builder v2.0
  @Field({ nullable: true })
  draft?: boolean

  @Field({ nullable: true })
  status?: number
}

@ObjectType()
export class PublicFormType extends FormType {
  @Field(type => GraphQLJSONObject, { nullable: true })
  translations: FormModel['translations']

  @Field(type => GraphQLJSONObject, { nullable: true })
  integrations?: Record<string, string>
}

@ObjectType()
export class SearchFormType {
  @Field({ nullable: true })
  teamId?: string

  @Field({ nullable: true })
  teamName?: string

  @Field({ nullable: true })
  formId?: string

  @Field({ nullable: true })
  formName?: string

  @Field({ nullable: true })
  templateId?: string

  @Field({ nullable: true })
  templateName?: string
}

@ObjectType()
export class FormAnalyticType {
  @Field()
  totalVisits: number

  @Field()
  submissionCount: number

  @Field()
  averageTime: number
}

@ObjectType()
export class FormReportResponseType {
  @Field()
  id: string

  @Field({ nullable: true })
  kind?: string

  @Field({ nullable: true })
  title?: string

  @Field()
  total: number

  @Field()
  count: number

  @Field()
  average: number

  @Field(type => GraphQLJSON)
  chooses?: any
}

@ObjectType()
class FormReportAnswerType {
  @Field()
  submissionId: string

  @Field()
  kind: string

  @Field(type => GraphQLJSON)
  value: any

  @Field()
  endAt: number
}

@ObjectType()
class FormReportSubmissionType {
  @Field()
  _id: string

  @Field(type => [FormReportAnswerType])
  answers: FormReportAnswerType[]
}

@ObjectType()
export class FormReportType {
  @Field(type => [FormReportResponseType])
  responses: FormReportResponseType[]

  @Field(type => [FormReportSubmissionType])
  submissions: FormReportSubmissionType[]
}

@ObjectType()
export class FormIntegrationType {
  @Field({ nullable: true })
  formId: string

  @Field()
  appId: string

  @Field(type => GraphQLJSONObject)
  attributes?: Record<string, any>

  @Field(type => Number)
  status: IntegrationStatusEnum
}
