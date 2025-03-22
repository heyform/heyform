import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { BillingCycleEnum } from './invoice.model'

export enum PlanPriceTypeEnum {
  PLAN = 1,
  ADDITIONAL_SEATS = 2
}

@Schema()
export class PlanPriceModel extends Document {
  @Prop()
  _id: string

  @Prop({ required: true })
  planId: string

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(PlanPriceTypeEnum)
  })
  type: PlanPriceTypeEnum

  @Prop({ type: Number, required: true, enum: Object.values(BillingCycleEnum) })
  billingCycle: BillingCycleEnum

  @Prop({ required: true })
  price: number

  @Prop({ default: 'USD' })
  currency: string
}

export const PlanPriceSchema = SchemaFactory.createForClass(PlanPriceModel)

PlanPriceSchema.index({ _id: 1, planId: 1 }, { unique: true })
