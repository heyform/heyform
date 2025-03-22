import { BillingCycleEnum, PlanGradeEnum } from '@/consts'

export interface PlacePriceType {
  billingCycle: BillingCycleEnum
  price: number
}

export interface PlanType {
  id: string
  name: string
  customUrlRedirects: boolean
  memberLimit: number
  storageLimit: string
  submissionLimit: number
  contactLimit: number
  questionLimit: number
  formLimit: number
  apiAccessLimit: number
  autoResponse: boolean
  customDomain: boolean
  customThankYouPage: boolean
  removeBranding: boolean
  fileExport: boolean
  whitelabelBranding: boolean
  grade: PlanGradeEnum
  prices: PlacePriceType[]
}
