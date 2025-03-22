import { BillingCycleEnum, PlanPriceTypeEnum } from '../../src/model'

export default [
  {
    _id: 'price_free_monthly',
    planId: '5f69647e0f2c111b86d0c366',
    type: PlanPriceTypeEnum.PLAN,
    billingCycle: BillingCycleEnum.MONTHLY,
    price: 24.99
  },
  {
    _id: 'price_free_annually',
    planId: '5f69647e0f2c111b86d0c366',
    type: PlanPriceTypeEnum.PLAN,
    billingCycle: BillingCycleEnum.ANNUALLY,
    price: 239.88
  },
  {
    _id: 'price_pro_monthly',
    planId: '5f69647e0f2c111b86d0c367',
    type: PlanPriceTypeEnum.PLAN,
    billingCycle: BillingCycleEnum.MONTHLY,
    price: 49.99
  },
  {
    _id: 'price_pro_annually',
    planId: '5f69647e0f2c111b86d0c367',
    type: PlanPriceTypeEnum.PLAN,
    billingCycle: BillingCycleEnum.ANNUALLY,
    price: 479.88
  }
]
