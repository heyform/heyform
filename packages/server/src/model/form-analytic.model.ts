import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class FormAnalyticModel extends Document {
  @Prop({ required: true, index: true })
  formId: string

  @Prop({ required: true })
  totalVisits: number

  @Prop({ required: true })
  submissionCount: number

  @Prop({ required: true })
  averageTime: number
}

export const FormAnalyticSchema = SchemaFactory.createForClass(FormAnalyticModel)
