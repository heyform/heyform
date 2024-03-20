import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum AppStatusEnum {
  ACTIVE = 1,
  DISCARD,
  BANNED,
  PENDING = 4
}

@Schema()
export class AppModel extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true
  })
  uniqueId: string

  @Prop({
    type: String,
    required: false
  })
  clientId: string

  @Prop({
    type: String,
    required: false
  })
  clientSecret: string

  @Prop({
    type: String,
    required: false
  })
  redirectUri: string

  @Prop({
    type: String,
    required: true
  })
  category: string

  @Prop({
    type: String,
    required: true
  })
  name: string

  @Prop({
    type: String,
    required: false
  })
  description: string

  @Prop({
    type: String,
    required: false
  })
  avatar: string

  @Prop({
    type: String,
    required: false
  })
  homepage?: string

  @Prop()
  helpLinkUrl?: string

  @Prop({
    type: Map,
    required: false
  })
  config?: Record<string, any>

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(AppStatusEnum)
  })
  status: AppStatusEnum
}

export const AppSchema = SchemaFactory.createForClass(AppModel)
