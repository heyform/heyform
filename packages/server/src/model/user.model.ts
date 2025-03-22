import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum UserLangEnum {
  EN = 'en',
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

  @Prop({ default: UserLangEnum.EN, enum: Object.values(UserLangEnum) })
  lang?: UserLangEnum

  /**
   * Stripe customer
   *
   * https://stripe.com/docs/api/customers
   */
  @Prop()
  customerId?: string

  @Prop({ default: false })
  isEmailVerified?: boolean

  // Add at 2021-12-27 (v2021.12.4)
  // Is the user request to delete their account for GDPR
  @Prop({ default: false })
  isDeletionScheduled?: boolean

  // Add at 2021-12-27 (v2021.12.4)
  // Account deletion date in seconds for GDPR
  @Prop({ default: 0 })
  deletionScheduledAt?: number

  @Prop({ default: false })
  isBlocked?: boolean

  @Prop()
  blockedAt?: number

  @Prop({ default: 0 })
  lastCheckedAt?: number

  // Add at 31 Aug 2024
  @Prop({ default: false })
  isOnboardRequired?: boolean

  // Add at 31 Aug 2024
  @Prop({ default: 0 })
  onboardedAt?: number

  // Add at 5 Oct 2024
  @Prop({ default: 0 })
  publishedFormAt?: number

  @Prop()
  crmLeadId?: string

  @Prop()
  source?: string

  /**
   * Check if user is register from social login,
   * isSocialAccount will not be used as a column in the user schema
   */
  isSocialAccount?: boolean

  /**
   * Check if user is onboarded
   */
  isOnboarded: boolean

  /**
   * Check if user has published form or not
   */
  hasPublishedForm: boolean
}

export const UserSchema = SchemaFactory.createForClass(UserModel)

UserSchema.virtual('isOnboarded').get(function () {
  if (!this.isOnboardRequired) {
    return true
  } else {
    return this.onboardedAt && this.onboardedAt > 0
  }
})

UserSchema.virtual('hasPublishedForm').get(function () {
  return this.publishedFormAt && this.publishedFormAt > 0
})
