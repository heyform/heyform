import { GeoLocation } from '@heyforms/nestjs'
import { UserAgent } from '@heyforms/nestjs'
import {
  Answer,
  HiddenFieldAnswer,
  SubmissionCategoryEnum,
  SubmissionStatusEnum,
  Variable
} from '@heyform-inc/shared-types-enums'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum ExportSubmissionFormatEnum {
  CSV = 'csv',
  PDF = 'pdf'
}

@Schema({
  timestamps: true
})
export class SubmissionModel extends Document {
  @Prop({ required: true, index: true })
  formId: string

  @Prop({
    type: String,
    required: true,
    enum: Object.values(SubmissionCategoryEnum),
    default: SubmissionCategoryEnum.INBOX
  })
  category: SubmissionCategoryEnum

  // 关联 contact
  @Prop()
  contactId?: string

  @Prop({ required: true })
  title: string

  @Prop()
  answers: Answer[]

  @Prop({ default: [] })
  hiddenFields?: HiddenFieldAnswer[]

  @Prop({ default: [] })
  variables?: Variable[]

  @Prop()
  startAt?: number

  @Prop()
  endAt?: number

  @Prop()
  ip: string

  @Prop()
  geoLocation: GeoLocation

  @Prop()
  userAgent: UserAgent

  @Prop()
  @Prop({
    type: Number,
    required: true,
    enum: Object.values(SubmissionStatusEnum),
    default: SubmissionStatusEnum.PUBLIC
  })
  status: SubmissionStatusEnum
}

export const SubmissionSchema = SchemaFactory.createForClass(SubmissionModel)
