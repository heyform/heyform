/**
 * @program: heyform-serves
 * @description: Submission IP address limit
 * @author: mufeng
 * @date: 11/9/21 10:05 AM
 **/

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class SubmissionIpLimitModel extends Document {
  @Prop({ required: true })
  formId: string

  @Prop({ required: true })
  ip: string

  @Prop({ required: true })
  count: number

  @Prop({ required: true, index: true })
  expiredAt: number
}

export const SubmissionIpLimitSchema = SchemaFactory.createForClass(
  SubmissionIpLimitModel
)

SubmissionIpLimitSchema.index({ formId: 1, ip: 1 }, { unique: true })
