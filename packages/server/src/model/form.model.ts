import {
  FormField,
  FormKindEnum,
  FormSettings,
  FormStatusEnum,
  HiddenField,
  FormModel as IForModel,
  InteractiveModeEnum,
  StripeAccount,
  ThemeSettings
} from '@heyform-inc/shared-types-enums'
import { Logic, Variable } from '@heyform-inc/shared-types-enums'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

import { helper, nanoid, parseJson } from '@heyform-inc/utils'

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

  @Prop({ required: true, default: 'Untitled' })
  name: string

  @Prop()
  description?: string

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(InteractiveModeEnum).filter(v => typeof v === 'number'),
    default: InteractiveModeEnum.GENERAL
  })
  interactiveMode: InteractiveModeEnum

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(FormKindEnum).filter(v => typeof v === 'number'),
    default: FormKindEnum.SURVEY
  })
  kind: FormKindEnum

  @Prop({ type: Object })
  settings?: FormSettings

  @Prop({ type: [Object], default: [] })
  fields?: FormField[]

  @Prop({ type: [Object], default: [] })
  hiddenFields?: HiddenField[]

  @Prop({ type: Map, default: {} })
  translations?: IForModel['translations']

  @Prop({ type: [Object], default: [] })
  logics?: Logic[]

  @Prop({ type: [Object], default: [] })
  variables?: Variable[]

  @Prop({ default: 0 })
  fieldsUpdatedAt?: number

  @Prop({ type: Object })
  themeSettings?: ThemeSettings

  @Prop({ type: Object })
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

  @Prop()
  topic?: string

  @Prop()
  reference?: string

  @Prop({ default: 0 })
  generatedAt?: number

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(FormStatusEnum).filter(v => typeof v === 'number'),
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
  return helper.isValid(this._drafts) && this._drafts !== JSON.stringify(this.fields)
})

FormSchema.index({ teamId: 1, projectId: 1 }, { unique: false })
