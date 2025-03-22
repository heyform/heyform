import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { PlanPriceModel } from './plan-price.model'

// Refactor at Dec 20, 2021 (v2021.12.3)
/**
 * BASIC:    $9.9/mo  $7.9*12/mo
 * PRO:      $24.9/mo $19.9*12/mo
 * BUSINESS: $49.9/mo $39.9*12/mo
 */
export enum PlanGradeEnum {
  FREE = 0,
  BASIC = 1,
  PRO = 2,
  PREMIUM = 2,
  BUSINESS = 3,
  ENTERPRISE = 4
}

@Schema()
export class PlanModel extends Document {
  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  multiLanguage: boolean

  @Prop({ required: true })
  contactLimit: number

  @Prop()
  formLimit: number

  @Prop()
  questionLimit: number

  @Prop({ required: true })
  apiAccessLimit: number

  @Prop({ required: true })
  autoResponse: boolean

  @Prop({ required: true })
  customThankYouPage: boolean

  @Prop({ required: true })
  passwordProtection: boolean

  @Prop()
  submissionLimit: number

  @Prop({ required: true })
  storageLimit: string

  @Prop({ required: true })
  formReport: boolean

  @Prop({ required: true })
  memberLimit: number

  @Prop({ required: true })
  customMetaData: boolean

  @Prop({ required: true })
  customDomain: boolean

  @Prop({ required: true })
  customCSS: boolean

  @Prop({ default: 0 })
  commissionRate: number

  @Prop({ required: true })
  customUrlRedirects: boolean

  @Prop({ required: true })
  fileExport: boolean

  @Prop({ required: true })
  whitelabelBranding: boolean

  @Prop({ required: true })
  themeCustomization: boolean

  @Prop({ required: true })
  hiddenFields: boolean

  @Prop({ required: true })
  aiForm: boolean

  @Prop({ type: Number, required: true, unique: true })
  grade: PlanGradeEnum

  @Prop({ default: 0 })
  status: number

  /**
   * price will not be used as a column in the plan schema
   */
  price?: PlanPriceModel

  /**
   * prices will not be used as a column in the plan schema
   */
  prices?: PlanPriceModel[]
}

export const PlanSchema = SchemaFactory.createForClass(PlanModel)
