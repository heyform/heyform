import { Choice, FieldKindEnum, Property } from '@heyform-inc/shared-types-enums'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

interface Choose extends Choice {
  count: number
}

export interface FormReportResponse {
  id: string
  total: number
  count?: number
  average?: number
  properties?: Property
  chooses?: Choose[]

  /**
   * Discard
   * Render all there 3 fields from form fields
   */
  kind?: FieldKindEnum
  title?: string
  description?: string
}

@Schema({
  timestamps: true
})
export class FormReportModel extends Document {
  @Prop({ required: true, unique: true })
  formId: string

  @Prop()
  responses?: FormReportResponse[]
}

export const FormReportSchema = SchemaFactory.createForClass(FormReportModel)
