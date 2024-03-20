import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

import {
  FormField,
  FormKindEnum,
  FormSettings,
  FormStatusEnum,
  InteractiveModeEnum,
  Logic,
  StripeAccount,
  ThemeSettings,
  Variable
} from '@heyform-inc/shared-types-enums'
import { nanoid } from '@heyform-inc/utils'

@Schema({
  timestamps: true
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

  @Prop({ default: [] })
  fields?: FormField[]

  @Prop({ default: [] })
  logics?: Logic[]

  @Prop({ default: [] })
  variables?: Variable[]

  @Prop()
  fieldUpdateAt?: number

  @Prop({ default: 0 })
  reversion?: number

  @Prop()
  themeSettings?: ThemeSettings

  // Stripe
  @Prop()
  stripeAccount?: StripeAccount

  @Prop({ default: -1 })
  retentionAt?: number

  @Prop({ default: false })
  suspended?: boolean

  @Prop({ default: false })
  draft?: boolean

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(FormStatusEnum),
    default: FormStatusEnum.NORMAL
  })
  status: FormStatusEnum
}

export const FormSchema = SchemaFactory.createForClass(FormModel)

FormSchema.index({ teamId: 1, projectId: 1 }, { unique: false })
