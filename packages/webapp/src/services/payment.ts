import {
  APPLY_COUPON_GQL,
  BillingCycleEnum,
  CONNECT_STRIPE_GQL,
  CUSTOMER_PORTAL_GQL,
  FREE_TRIAL_GQL,
  PAYMENT_GQL,
  PLANS_GQL,
  REVOKE_STRIPE_ACCOUNT_GQL,
  STRIPE_AUTHORIZE_URL_GQL
} from '@/consts'
import { apollo } from '@/utils'

export class PaymentService {
  static async plans() {
    return apollo.query({
      query: PLANS_GQL
    })
  }

  static async applyCoupon(input: {
    teamId: string
    planId: string
    billingCycle: BillingCycleEnum
    code: string
  }) {
    return apollo.mutate({
      mutation: APPLY_COUPON_GQL,
      variables: {
        input
      }
    })
  }

  static async payment(input: {
    teamId: string
    planId: string
    billingCycle: BillingCycleEnum
    code?: string | undefined | null
    couponId?: string | undefined | null
    paymentMethod?: string
  }) {
    return apollo.mutate({
      mutation: PAYMENT_GQL,
      variables: {
        input
      }
    })
  }

  static freeTrial(teamId: string, planId: string) {
    return apollo.mutate({
      mutation: FREE_TRIAL_GQL,
      variables: {
        input: {
          teamId,
          planId
        }
      }
    })
  }

  static stripeAuthorizeUrl(formId: string) {
    return apollo.query({
      query: STRIPE_AUTHORIZE_URL_GQL,
      variables: {
        input: {
          formId
        }
      }
    })
  }

  static connectStripe(formId: string, state: string, code: string) {
    return apollo.mutate({
      mutation: CONNECT_STRIPE_GQL,
      variables: {
        input: {
          formId,
          state,
          code
        }
      }
    })
  }

  static revokeStripeAccount(formId: string) {
    return apollo.mutate({
      mutation: REVOKE_STRIPE_ACCOUNT_GQL,
      variables: {
        input: {
          formId
        }
      }
    })
  }
  static customerPortal(teamId: string) {
    return apollo.mutate({
      mutation: CUSTOMER_PORTAL_GQL,
      variables: {
        input: {
          teamId
        }
      }
    })
  }
}
