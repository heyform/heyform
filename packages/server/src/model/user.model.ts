import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum UserLangEnum {
  EN = 'en',
  PT_BR = 'pt-br',
  ZH_CN = 'zh-cn'
}

@Schema({
  timestamps: true
})
export class UserModel extends Document {
  @Prop({ required: true })
  name: string

  @Prop()
  email?: string

  @Prop()
  password?: string

  @Prop()
  avatar?: string

  @Prop()
  phoneNumber?: string

  @Prop()
  address?: string

  @Prop()
  note?: string

  @Prop({ default: UserLangEnum.EN })
  lang?: UserLangEnum

  @Prop()
  customerId?: string

  @Prop({ default: false })
  isEmailVerified?: boolean

  @Prop({ default: false })
  isDeletionScheduled?: boolean

  @Prop({ default: 0 })
  deletionScheduledAt?: number

  @Prop({ default: false })
  isBlocked?: boolean

  @Prop()
  blockedAt?: number

  @Prop({ default: 0 })
  lastCheckedAt?: number

  @Prop({ default: 0 })
  publishedFormAt?: number

  @Prop()
  source?: string

  isSocialAccount?: boolean

  hasPublishedForm: boolean
}

export const UserSchema = SchemaFactory.createForClass(UserModel)

UserSchema.virtual('hasPublishedForm').get(function () {
  return this.publishedFormAt && this.publishedFormAt > 0
})
