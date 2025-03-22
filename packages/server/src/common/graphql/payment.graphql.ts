import { BillingCycleEnum, InvoiceStatusEnum } from '@model'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsEnum, Min } from 'class-validator'
import { FormDetailInput } from './form.graphql'

@InputType()
export class CreateInvoiceInput {
  @Field()
  teamId: string

  @Field()
  planId: string

  @Field(type => Number)
  @IsEnum(Object.values(BillingCycleEnum))
  billingCycle: BillingCycleEnum

  @Field({ nullable: true })
  couponId?: string
}

@InputType()
export class InvoiceStatusInput {
  @Field()
  teamId: string

  @Field()
  invoiceId: string
}

@InputType()
export class PaymentInput {
  @Field()
  teamId: string

  @Field()
  planId: string

  @Field(type => Number)
  @IsEnum(Object.values(BillingCycleEnum))
  billingCycle: BillingCycleEnum

  @Field({ nullable: true })
  code?: string
}

@InputType()
export class ApplyCouponInput {
  @Field()
  teamId: string

  @Field()
  planId: string

  @Field(type => Number)
  @IsEnum(Object.values(BillingCycleEnum))
  billingCycle: BillingCycleEnum

  @Field()
  code: string
}

@ObjectType()
export class ApplyCouponType {
  @Field()
  id: string

  @Field({ nullable: true })
  amountOff?: number

  @Field({ nullable: true })
  percentOff?: number
}

@InputType()
export class AdditionalSeatInput {
  @Field()
  teamId: string

  @Field()
  @Min(1)
  additionalSeats: number
}

@ObjectType()
export class InvoiceType {
  @Field()
  id: string

  @Field({ nullable: true })
  note?: string

  @Field({ nullable: true })
  pdfUrl?: string

  @Field()
  total: number

  @Field({ nullable: true })
  paidAt: Date

  @Field(type => Number)
  status: InvoiceStatusEnum
}

@ObjectType()
export class PaymentType {
  @Field({ nullable: true })
  note?: string

  @Field({ nullable: true })
  sessionUrl?: string
}

@InputType()
export class CalculateInvoiceTotalInput {
  @Field({
    nullable: true
  })
  couponId?: string

  @Field()
  teamId: string

  @Field()
  planId: string

  @Field(type => Number)
  @IsEnum(Object.values(BillingCycleEnum))
  billingCycle: BillingCycleEnum
}

@ObjectType()
export class CalculateInvoiceTotalResults {
  @Field()
  total: number // (最终价格)

  @Field()
  fee: number // (实际价格)

  @Field({ nullable: true })
  savings?: number //（减免金额，如果有优惠码）
}

@InputType()
export class ConnectStripeInput extends FormDetailInput {
  @Field()
  state: string

  @Field()
  code: string
}

@ObjectType()
export class ConnectStripeType {
  @Field()
  accountId: string

  @Field()
  email: string
}
