/**
 * Created by jiangwei on 2020/10/27.
 * Copyright (c) 2020 Heyooo, Inc. all rights reserved
 */
import { nanoid } from '@heyform-inc/utils'
import { BillingCycleEnum } from '@model'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum CouponTypeEnum {
  PERCENTAGE = 1, // Discount in proportion (-30%)
  FIXED_AMOUNT = 2, // Discount in fixed amount (-$50)
  PRICE_OVERRIDE = 3 // Overwrite the original price ($233 -> $20)
}

export enum CouponStatusEnum {
  ACTIVE = 1,
  EXPIRED = 2
}

@Schema({
  timestamps: true
})
export class CouponModel extends Document {
  @Prop({ default: () => nanoid(8) })
  _id: string

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(CouponTypeEnum)
  })
  type: CouponTypeEnum

  @Prop({
    required: true
  })
  recurring: boolean

  @Prop({
    type: [String],
    required: false,
    default: []
  })
  appliedPlans?: string[]

  @Prop({
    type: Number,
    required: false
  })
  billingCycle?: BillingCycleEnum
  @Prop({
    type: Number,
    required: true,
    default: 0
  })
  value: number

  @Prop({ required: true, index: true })
  startAt: number

  @Prop({ required: true, index: true })
  endAt: number

  @Prop({ required: false, default: 0 })
  maximumCount?: number

  @Prop({ required: false, default: 0 })
  usedCount?: number

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(CouponStatusEnum)
  })
  status: CouponStatusEnum
}

export const CouponSchema = SchemaFactory.createForClass(CouponModel)
