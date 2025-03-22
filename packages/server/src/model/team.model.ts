import { INVITE_CODE_EXPIRE_DAYS } from '@environments'
import { date, nanoid } from '@heyform-inc/utils'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { CustomDomainModel } from 'src/model/custom-domain.model'
import { GroupModel } from './group.model'
import { BillingCycleEnum } from './invoice.model'
import { PlanModel } from './plan.model'
import { ProjectModel } from './project.model'
import { BrandKitModel } from './brand-kit.model'

export enum SubscriptionStatusEnum {
  PENDING = 0,
  ACTIVE = 1,
  EXPIRED = 2
}

@Schema({
  timestamps: true
})
export class SubscriptionModel extends Document {
  // Stripe subscription ID should be unique
  @Prop()
  id?: string

  @Prop({ required: true })
  planId: string

  @Prop({ type: Number, required: true, enum: Object.values(BillingCycleEnum) })
  billingCycle: BillingCycleEnum

  @Prop()
  startAt: number

  @Prop()
  endAt: number

  @Prop({ default: false })
  isCanceled?: boolean

  @Prop()
  canceledAt?: number

  @Prop({ default: false })
  trialing?: boolean

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(SubscriptionStatusEnum)
  })
  status: SubscriptionStatusEnum
}

@Schema({
  timestamps: true
})
export class TeamModel extends Document {
  @Prop({ default: () => nanoid(8) })
  _id: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  ownerId: string

  @Prop()
  avatar?: string

  // Discard
  @Prop()
  customDomain?: string

  @Prop()
  enableCustomDomain?: boolean

  @Prop()
  removeBranding?: boolean

  @Prop({ default: () => nanoid(), unique: true })
  inviteCode: string

  // team invite code expire at unix timestamp
  @Prop({
    default: () => {
      return date().add(INVITE_CODE_EXPIRE_DAYS, 'day').unix()
    }
  })
  inviteCodeExpireAt: number

  @Prop({ default: true })
  allowJoinByInviteLink: boolean

  @Prop()
  inviteLinkResetAt?: number

  @Prop()
  storageQuota?: number

  // Discard at Dec 20, 2021 (v2021.12.3)
  // @Prop({ default: 0 })
  // submissionQuota?: number

  // Discard at Dec 20, 2021 (v2021.12.4)
  // @Prop({ default: 0 })
  // submissionResetAt?: number

  @Prop({ type: SubscriptionModel })
  subscription: SubscriptionModel

  // Add at Dec 29, 2021 (v2021.12.4)
  @Prop({
    default: 0,
    get(value: number) {
      return value || 0
    }
  })
  additionalSeats: number

  // Add at 2022-09-08
  // End of trial date,
  // if this value > 0, user will not be allowed to trial for Premium plan when creating new workspace
  @Prop({ default: 0 })
  trialEndAt?: number

  @Prop()
  crmAccountId?: string

  /**
   * Attach references to the team model for easy query,
   * will not be used as a column in the team schema
   */
  // Projects
  projects?: ProjectModel[]

  // Audience Groups
  groups?: GroupModel[]

  // Team Plan
  plan?: PlanModel

  // Member count
  memberCount?: number

  // Contact count
  contactCount?: number

  // Custom hostnames
  customHostnames?: CustomDomainModel[]

  // Brand kit
  brandKits?: BrandKitModel[]

  // If the user is team owner
  isOwner?: boolean
}

export const TeamSchema = SchemaFactory.createForClass(TeamModel)
