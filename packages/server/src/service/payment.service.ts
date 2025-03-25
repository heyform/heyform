import {
  APP_HOMEPAGE,
  STRIPE_CONNECT_CLIENT_ID,
  STRIPE_SECRET_KEY,
  STRIPE_VERSION
} from '@environments'
import { helper, timestamp } from '@heyform-inc/utils'
import {
  BillingCycleEnum,
  PlanGradeEnum,
  PlanModel,
  PlanPriceModel,
  PlanPriceTypeEnum,
  SubscriptionModel,
  SubscriptionStatusEnum,
  TeamModel
} from '@model'
import { BadRequestException, Injectable } from '@nestjs/common'
import Stripe from 'stripe'
import { PlanService } from './plan.service'
import { TeamService } from './team.service'

interface CreateSessionOptions {
  email: string
  team: TeamModel
  planId: string
  billingCycle: BillingCycleEnum
  additionalSeats?: number
  promotionCodeId?: string
  freeTrial?: number
}

interface CreateSubscriptionOptions {
  teamId: string
  promotionCodeId: string
  planId: string
  billingCycle: BillingCycleEnum
  email: string
}

interface CreateFreeTrialOptions
  extends Omit<CreateSubscriptionOptions, 'planId' | 'promotionCodeId'> {
  plan: PlanModel
  trialEnd: number
}

interface PaymentIntentOptions {
  amount: number
  currency: string
  applicationFeeAmount: number
  stripeAccountId: string
  metadata?: Record<string, string>
}

const BILLING_CYCLE_MAPS = {
  [BillingCycleEnum.FOREVER]: 'forever',
  [BillingCycleEnum.MONTHLY]: 'monthly',
  [BillingCycleEnum.ANNUALLY]: 'annually'
}

@Injectable()
export class PaymentService {
  private readonly stripe!: Stripe

  constructor(
    private readonly planService: PlanService,
    private readonly teamService: TeamService
  ) {
    this.stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_VERSION as any,
      maxNetworkRetries: 3
    })
  }

  private static planPrice(
    plan: PlanModel,
    type: PlanPriceTypeEnum,
    billingCycle: BillingCycleEnum
  ): PlanPriceModel | undefined {
    return plan.prices!.find(
      row => row.type === type && row.billingCycle === billingCycle
    )
  }

  private static successUrl(teamId: string): string {
    return PaymentService.cancelUrl(teamId) + '/success'
  }

  private static cancelUrl(teamId: string): string {
    return `${APP_HOMEPAGE}/workspace/${teamId}/billing`
  }

  async createCheckoutSession({
    email,
    team,
    planId,
    billingCycle,
    promotionCodeId,
    freeTrial
  }: CreateSessionOptions): Promise<string> {
    const successUrl = PaymentService.successUrl(team.id)
    const cancelUrl = PaymentService.cancelUrl(team.id)

    const plan = await this.planService.findById(planId)
    const planPrice = PaymentService.planPrice(
      plan,
      PlanPriceTypeEnum.PLAN,
      billingCycle
    )

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planPrice._id,
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          teamId: team.id
        }
      },
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl
    }

    if (freeTrial) {
      // Change to if_required at Jun 24, 2024
      // @ts-ignore
      // Change to required at Jul 23, 2024
      params.payment_method_collection = 'always'
      params.subscription_data.trial_period_days = freeTrial
      // // @ts-ignore
      // params.subscription_data.trial_settings = {
      //   end_behavior: {
      //     missing_payment_method: 'cancel'
      //   }
      // }
    }

    if (helper.isValid(promotionCodeId)) {
      params.discounts = [
        {
          promotion_code: promotionCodeId
        }
      ]
    }

    const session = await this.stripe.checkout.sessions.create(params)
    return session.url
  }

  async createFreeTrial({
    email,
    teamId,
    plan,
    billingCycle,
    trialEnd
  }: CreateFreeTrialOptions): Promise<Stripe.Response<Stripe.Subscription>> {
    const customer = await this.stripe.customers.create({
      email
    })

    const planPrice = PaymentService.planPrice(
      plan,
      PlanPriceTypeEnum.PLAN,
      billingCycle
    )

    return this.stripe.subscriptions.create({
      customer: customer.id,
      cancel_at_period_end: true,
      items: [
        {
          price: planPrice._id,
          quantity: 1
        }
      ],
      // Trial periods on subscriptions https://stripe.com/docs/billing/subscriptions/trials
      trial_end: trialEnd,
      metadata: {
        teamId
      }
    })
  }

  async createSubscription({
    email,
    teamId,
    promotionCodeId,
    planId,
    billingCycle
  }: CreateSubscriptionOptions): Promise<Stripe.Response<Stripe.Subscription>> {
    const customer = await this.stripe.customers.create({
      email
    })

    const plan = await this.planService.findById(planId)
    const planPrice = PaymentService.planPrice(
      plan,
      PlanPriceTypeEnum.PLAN,
      billingCycle
    )

    return this.stripe.subscriptions.create({
      customer: customer.id,
      cancel_at_period_end: true,
      promotion_code: promotionCodeId,
      items: [
        {
          price: planPrice._id,
          quantity: 1
        }
      ],
      metadata: {
        teamId
      }
    })
  }

  async subscription(
    subscriptionId: string
  ): Promise<Stripe.Response<Stripe.Subscription>> {
    return this.stripe.subscriptions.retrieve(subscriptionId)
  }

  async isInactiveSubscription(
    subscription: SubscriptionModel
  ): Promise<boolean> {
    if (
      helper.isEmpty(subscription.id) ||
      subscription.status !== SubscriptionStatusEnum.ACTIVE
    ) {
      return true
    }

    const { status } = await this.subscription(subscription.id)
    return status === 'canceled' || status === 'incomplete_expired'
  }

  async changeSubscription({
    team,
    planId,
    billingCycle,
    additionalSeats = 0,
    promotionCodeId
  }: Omit<CreateSessionOptions, 'email'>): Promise<string> {
    const subscriptionId = team!.subscription.id
    const subscription = await this.subscription(subscriptionId)

    if (helper.isEmpty(subscription)) {
      throw new BadRequestException({
        code: 'INVALID_SUBSCRIPTION',
        message: 'The workspace does not subscribes to the plan'
      })
    }

    const [plan, memberCount] = await Promise.all([
      this.planService.findById(planId),
      this.teamService.memberCount(team.id)
    ])
    const memberLimit = plan.memberLimit || 1

    if (plan.grade < team.plan.grade && memberCount > memberLimit) {
      throw new BadRequestException({
        code: 'PLAN_MEMBER_LIMIT',
        message: `Downgrading to the ${plan.name} plan allows for only ${memberLimit} member(s). Please remove excess members before proceeding.`
      })
    }

    // Cancel subscription
    if (plan.grade === PlanGradeEnum.FREE) {
      await this.stripe.subscriptions.del(subscriptionId)

      // const freePlan = await this.planService.findByGrade(PlanGradeEnum.FREE)
      await this.teamService.update(team.id, {
        additionalSeats: 0,
        subscription: {
          planId: '',
          billingCycle: BillingCycleEnum.FOREVER,
          startAt: timestamp(),
          endAt: -1,
          status: SubscriptionStatusEnum.ACTIVE
        }
      })

      return
    }

    let note = ''

    if (plan.grade < team.plan.grade) {
      note = `Downgraded to ${plan.name} plan ${BILLING_CYCLE_MAPS[billingCycle]}`
    } else if (plan.grade > team.plan.grade) {
      note = `Upgraded to ${plan.name} plan ${BILLING_CYCLE_MAPS[billingCycle]}`
    } else {
      if (additionalSeats > 0) {
        note = `Add ${additionalSeats} seats to ${plan.name} plan ${BILLING_CYCLE_MAPS[billingCycle]}`
      } else {
        note = `Change ${plan.name} plan billing cycle to ${BILLING_CYCLE_MAPS[billingCycle]}`
      }
    }

    const planPrice = PaymentService.planPrice(
      plan,
      PlanPriceTypeEnum.PLAN,
      billingCycle
    )
    const items: Stripe.SubscriptionUpdateParams.Item[] = [
      {
        id: subscription.items.data[0].id,
        price: planPrice.id
      }
    ]

    // let seatsCount = team.additionalSeats
    // const additionalSeatPrice = PaymentService.planPrice(
    //   plan,
    //   PlanPriceTypeEnum.ADDITIONAL_SEATS,
    //   billingCycle
    // )
    //
    // if (additionalSeats) {
    //   seatsCount += additionalSeats
    //
    //   items = [
    //     {
    //       id: subscription.items.data[0].id
    //     }
    //   ]
    //
    //   if (subscription.items.data[1]?.id) {
    //     items.push({
    //       id: subscription.items.data[1].id,
    //       quantity: seatsCount
    //     })
    //   } else {
    //     items.push({
    //       price: additionalSeatPrice.id,
    //       quantity: seatsCount
    //     })
    //   }
    // } else {
    //   // 降级或者升级时，保留超出套餐额度的坐席数量
    //   seatsCount = Math.max(memberCount - plan.memberLimit, 0)
    //
    //   if (seatsCount > 0) {
    //     items.push({
    //       id: subscription.items.data[1]?.id,
    //       price: additionalSeatPrice.id,
    //       quantity: seatsCount
    //     })
    //   }
    // }

    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
      promotion_code: promotionCodeId,
      /**
       * Customer will immediately pay the price difference when switching to a
       * more expensive subscription on the same billing cycle
       *
       * https://stripe.com/docs/billing/subscriptions/upgrade-downgrade#immediate-payment
       */
      proration_behavior: 'always_invoice',
      metadata: {
        teamId: team.id,
        planId: plan.id,
        billingCycle,
        // additionalSeats: seatsCount,
        note
      },
      items
    })

    return note
  }

  async cancelSubscription(subscriptionId: string) {
    if (helper.isValid(subscriptionId)) {
      const subscription = await this.subscription(subscriptionId)

      if (helper.isValid(subscription)) {
        await this.stripe.subscriptions.del(subscriptionId)
      }
    }
  }

  async invoice(invoiceId: string): Promise<Stripe.Response<Stripe.Invoice>> {
    return this.stripe.invoices.retrieve(invoiceId)
  }

  async promotionCode(code: string): Promise<Stripe.PromotionCode | undefined> {
    const result = await this.stripe.promotionCodes.list({
      active: true,
      code,
      expand: ['data.coupon.applies_to']
    })
    return result.data[0]
  }

  async prices(products: string[]): Promise<Stripe.Price[]> {
    const result = await this.stripe.prices.list({
      active: true,
      limit: 100
    })
    return result.data.filter(row => products.includes(row.product as string))
  }

  async validateCouponCode(
    planId: string,
    code: string,
    billingCycle: BillingCycleEnum
  ): Promise<Stripe.PromotionCode> {
    if (helper.isEmpty(code)) {
      throw new BadRequestException('Coupon code is invalid')
    }

    const promotionCode = await this.promotionCode(code)

    if (
      !promotionCode ||
      helper.isEmpty(promotionCode.coupon?.applies_to?.products)
    ) {
      throw new BadRequestException('Coupon code is invalid')
    }

    const prices = await this.prices(promotionCode.coupon.applies_to.products)

    if (helper.isEmpty(prices)) {
      throw new BadRequestException(
        'There is no applicable plan for this coupon code'
      )
    }

    const planPrices = await this.planService.findPlanPricesBy({
      type: PlanPriceTypeEnum.PLAN,
      planId: planId
    })

    if (helper.isEmpty(planPrices)) {
      throw new BadRequestException(
        'There is no applicable plan for this coupon code'
      )
    }

    const priceIds = prices.map(p => p.id)
    const filteredPlanPrices = planPrices.filter(row =>
      priceIds.includes(row.id)
    )

    if (helper.isEmpty(filteredPlanPrices)) {
      throw new BadRequestException(
        'There is no applicable plan for this coupon code'
      )
    }

    const allowedBillingCycles = filteredPlanPrices.map(row => row.billingCycle)

    if (!allowedBillingCycles.includes(billingCycle)) {
      const t = BILLING_CYCLE_MAPS[billingCycle]

      throw new BadRequestException(
        `Coupon code is not valid for ${t} subscription`
      )
    }

    return promotionCode
  }

  getAuthorizeUrl(state: string, email: string): string {
    return this.stripe.oauth.authorizeUrl({
      client_id: STRIPE_CONNECT_CLIENT_ID,
      response_type: 'code',
      scope: 'read_write',
      state,
      stripe_user: {
        email
      }
    })
  }

  async getConnectAccount(code: string) {
    const result = await this.stripe.oauth.token({
      grant_type: 'authorization_code',
      code
    })

    const accountId = result.stripe_user_id
    const account = await this.stripe.accounts.retrieve(accountId)

    if (!account.charges_enabled || !account.details_submitted) {
      throw new BadRequestException('Something went wrong, please try again.')
    }

    return {
      accountId,
      email:
        account.email || account.settings?.dashboard?.display_name || accountId
    }
  }

  async createPaymentIntent(options: PaymentIntentOptions): Promise<string> {
    const result = await this.stripe.paymentIntents.create(
      {
        amount: options.amount,
        currency: options.currency,
        application_fee_amount: options.applicationFeeAmount,
        metadata: options.metadata
      },
      {
        stripeAccount: options.stripeAccountId
      }
    )

    return result.client_secret
  }

  public async createCustomPortal(teamId: string, customerId: string) {
    const params = {
      customer: customerId,
      return_url: `${APP_HOMEPAGE}/workspace/${teamId}`
    }

    return (await this.stripe.billingPortal.sessions.create(
      params
    )) as Stripe.BillingPortal.Session
  }

  constructEvent(
    payload: Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret)
  }
}
