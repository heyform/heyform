import {
  FormField,
  FormKindEnum,
  FormModel as IForModel,
  FormSettings,
  FormStatusEnum,
  HiddenField,
  InteractiveModeEnum,
  StripeAccount,
  ThemeSettings
} from '@heyform-inc/shared-types-enums'
import { Logic, Variable } from '@heyform-inc/shared-types-enums'
import { helper, nanoid, parseJson } from '@heyform-inc/utils'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true
  }
})
export class FormModel extends Document {
  @Prop({ default: () => nanoid(8) })
  _id: string

  @Prop({ required: true, index: true })
  teamId: string

  @Prop({ required: true, index: true })
  projectId: string

  @Prop({ required: true })
  memberId: string

  @Prop({ required: true })
  name: string

  // Discard at Apr 14, 2022
  // // HeyForm Form Builder v2.0
  // @Prop({ default: [] })
  // nameSchema?: any[]

  // @Discarded
  @Prop()
  description?: string

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(InteractiveModeEnum),
    default: InteractiveModeEnum.GENERAL
  })
  interactiveMode: InteractiveModeEnum

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(FormKindEnum),
    default: FormKindEnum.SURVEY
  })
  kind: FormKindEnum

  @Prop()
  settings?: FormSettings

  // Discard at Apr 14, 2022
  // // HeyForm Form Builder v2.0
  // @Prop()
  // welcomePage?: ThankYouPage
  //
  // // HeyForm Form Builder v2.0
  // @Prop()
  // thankYouPage?: ThankYouPage

  @Prop({ default: [] })
  fields?: FormField[]

  // Add in April 22, 2024
  @Prop({ default: [] })
  hiddenFields?: HiddenField[]

  @Prop({ type: Map, default: {} })
  translations?: IForModel['translations']

  // Add in Jun 30, 2022
  @Prop({ default: [] })
  logics?: Logic[]

  // Add in Jun 30, 2022
  @Prop({ default: [] })
  variables?: Variable[]

  @Prop({ default: 0 })
  fieldsUpdatedAt?: number

  @Prop()
  themeSettings?: ThemeSettings

  // Stripe
  // Add at Sep 29, 2022
  @Prop()
  stripeAccount?: StripeAccount

  @Prop({ default: -1 })
  retentionAt?: number

  @Prop({ default: false })
  suspended?: boolean

  @Prop()
  _drafts: string

  @Prop({ default: 0 })
  publishedAt?: number

  @Prop({ default: 0 })
  version: number

  // AI forms
  // Add at Jul 26, 2024
  @Prop()
  topic?: string

  @Prop()
  reference?: string

  @Prop({ default: 0 })
  generatedAt?: number

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(FormStatusEnum),
    default: FormStatusEnum.NORMAL
  })
  status: FormStatusEnum
}

export const FormSchema = SchemaFactory.createForClass(FormModel)

FormSchema.virtual('drafts').get(function () {
  if (helper.isValid(this._drafts)) {
    const drafts = parseJson(this._drafts)

    if (helper.isValidArray(drafts)) {
      return drafts
    }
  }

  return this.fields || []
})

FormSchema.virtual('isDraft').get(function () {
  return (
    helper.isEmpty(this.fields) &&
    (this.version === 0 || helper.isEmpty(this._drafts) || !this.publishedAt)
  )
})

FormSchema.virtual('canPublish').get(function () {
  return (
    helper.isValid(this._drafts) && this._drafts !== JSON.stringify(this.fields)
  )
})

FormSchema.index({ teamId: 1, projectId: 1 }, { unique: false })
