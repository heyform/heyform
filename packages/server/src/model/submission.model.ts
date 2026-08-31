import {
  Answer,
  HiddenFieldAnswer,
  SubmissionCategoryEnum,
  SubmissionStatusEnum,
  Variable
} from '@heyform-inc/shared-types-enums'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

import { UserAgent } from '@utils'

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

  @Prop()
  pseudonymId?: string

  @Prop({
    type: String,
    required: true,
    default: SubmissionCategoryEnum.INBOX
  })
  category: SubmissionCategoryEnum

  @Prop({ required: true })
  title: string

  @Prop({ type: [Object], default: [] })
  answers: Answer[]

  @Prop({ type: [Object], default: [] })
  hiddenFields?: HiddenFieldAnswer[]

  @Prop({ type: [Object], default: [] })
  variables?: Variable[]

  @Prop()
  startAt?: number

  @Prop()
  endAt?: number

  @Prop()
  ip: string

  @Prop({ type: Object })
  userAgent: UserAgent

  @Prop({
    type: Number,
    required: true,
    default: SubmissionStatusEnum.PUBLIC
  })
  status: SubmissionStatusEnum
}

export const SubmissionSchema = SchemaFactory.createForClass(SubmissionModel)

SubmissionSchema.index(
  { formId: 1, pseudonymId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      pseudonymId: { $type: 'string' }
    }
  }
)
