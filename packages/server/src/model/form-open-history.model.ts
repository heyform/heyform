import { Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class FormOpenHistoryModel extends Document {}

export const FormOpenHistorySchema = SchemaFactory.createForClass(
  FormOpenHistoryModel
)
