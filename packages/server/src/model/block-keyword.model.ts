import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema()
export class BlockKeywordModel extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true
  })
  keyword: string
}

export const BlockKeywordSchema = SchemaFactory.createForClass(
  BlockKeywordModel
)
