import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { nanoid } from '@heyform-inc/utils'

@Schema({
  timestamps: true
})
export class FormCustomReportModel extends Document {
  @Prop({ default: () => nanoid(8) })
  _id: string

  @Prop({ required: true })
  formId: string

  @Prop()
  hiddenFields?: string[]

  @Prop({ type: Map })
  theme?: Record<string, any>

  @Prop()
  enablePublicAccess?: boolean
}

export const FormCustomReportSchema = SchemaFactory.createForClass(
  FormCustomReportModel
)
