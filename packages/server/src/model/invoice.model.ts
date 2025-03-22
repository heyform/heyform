import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum BillingCycleEnum {
  FOREVER = 0,
  MONTHLY,
  ANNUALLY
}

export enum InvoiceStatusEnum {
  EXPIRED,
  UNPAID,
  PAID
}

@Schema({
  timestamps: true
})
export class InvoiceModel extends Document {
  @Prop({ required: true })
  _id: string

  @Prop({ index: true })
  teamId?: string

  @Prop()
  planId?: string

  @Prop()
  subscriptionId?: string

  @Prop()
  note?: string

  @Prop()
  total: number

  @Prop()
  pdfUrl?: string

  @Prop()
  paidAt?: Date

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(InvoiceStatusEnum)
  })
  status: InvoiceStatusEnum
}

export const InvoiceSchema = SchemaFactory.createForClass(InvoiceModel)
