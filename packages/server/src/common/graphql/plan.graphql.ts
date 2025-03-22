import { BillingCycleEnum, PlanGradeEnum, PlanPriceTypeEnum } from '@model'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
class PlanPriceType {
  @Field(type => Number)
  billingCycle: BillingCycleEnum

  @Field(type => Number)
  type: PlanPriceTypeEnum

  @Field()
  price: number
}

@ObjectType()
export class PlanType {
  @Field()
  id: string

  @Field()
  name: string

  // TODO - discard
  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  multiLanguage: boolean

  @Field({ nullable: true })
  contactLimit: number

  @Field({ nullable: true })
  formLimit: number

  @Field({ nullable: true })
  questionLimit: number

  @Field({ nullable: true })
  apiAccessLimit: number

  @Field({ nullable: true })
  autoResponse: boolean

  @Field({ nullable: true })
  customThankYouPage: boolean

  @Field({ nullable: true })
  passwordProtection: boolean

  @Field({ nullable: true })
  submissionLimit: number

  @Field({ nullable: true })
  storageLimit: string

  @Field({ nullable: true })
  formReport: boolean

  @Field({ nullable: true })
  memberLimit: number

  @Field({ nullable: true })
  customMetaData: boolean

  @Field({ nullable: true })
  customDomain: boolean

  @Field({ nullable: true })
  customCSS: boolean

  @Field({ nullable: true })
  commissionRate: number

  @Field({ nullable: true })
  customUrlRedirects: boolean

  @Field({ nullable: true })
  fileExport: boolean

  @Field({ nullable: true })
  whitelabelBranding: boolean

  @Field({ nullable: true })
  themeCustomization: boolean

  @Field({ nullable: true })
  hiddenFields: boolean

  @Field(type => Number)
  grade: PlanGradeEnum

  @Field(type => [PlanPriceType])
  prices: PlanPriceType
}
