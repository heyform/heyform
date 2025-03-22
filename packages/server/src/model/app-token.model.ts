import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class AppTokenModel extends Document {
  @Prop({
    type: String,
    required: true
  })
  appId: string

  @Prop({
    type: String,
    required: true
  })
  userId: string

  @Prop({
    type: String,
    required: true,
    unique: true
  })
  access: string

  @Prop({
    type: Number
  })
  accessExpireAt: number

  @Prop({
    type: String,
    required: true,
    unique: true
  })
  refresh: string

  @Prop({
    type: Number
  })
  refreshExpireAt: number
}

export const AppTokenSchema = SchemaFactory.createForClass(AppTokenModel)
