import { STRIPE_SUBSCRIPTION_SECRET_KEY } from '@environments'
import { helper, unixDate } from '@heyform-inc/utils'
import { SubscriptionStatusEnum } from '@model'
import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req
} from '@nestjs/common'
import {
  PaymentService,
  PlanService,
  QueueService,
  TeamService,
  UserService
} from '@service'
import { EspoCRMAction } from '@utils'

// const BILLING_REASONS = {
//   subscription_create: 'Subscribed plan',
//   subscription_cycle: 'Renew plan'
// }

const BILLING_CYCLES = [, 'monthly', 'yearly']

const SUBSCRIPTION_STATUS = {
  active: SubscriptionStatusEnum.ACTIVE,
  canceled: SubscriptionStatusEnum.ACTIVE,
  trialing: SubscriptionStatusEnum.ACTIVE,

  past_due: SubscriptionStatusEnum.PENDING,
  unpaid: SubscriptionStatusEnum.PENDING,
  incomplete: SubscriptionStatusEnum.PENDING,
  incomplete_expired: SubscriptionStatusEnum.PENDING
}

// const INVOICE_STATUS = {
//   draft: InvoiceStatusEnum.UNPAID,
//   open: InvoiceStatusEnum.UNPAID,
//   paid: InvoiceStatusEnum.PAID,
//   void: InvoiceStatusEnum.UNPAID,
//   uncollectible: InvoiceStatusEnum.UNPAID
// }

@Controller()
export class StripeWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly teamService: TeamService,
    private readonly planService: PlanService,
    private readonly userService: UserService,
    private readonly queueService: QueueService
  ) {}

  @Post('/payment/stripe/webhook')
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any
  ) {
    const event = this.paymentService.constructEvent(
      req.body,
      signature,
      STRIPE_SUBSCRIPTION_SECRET_KEY
    )

    const object: Record<string, any> = event.data.object

    // 排除订阅之后付款超时的情况
    if (object.status === 'incomplete_expired') {
      return `Error: ${object.status}`
    }

    if (object.status === 'past_due') {
      // TODO - send a email to the team owner
      return `Error: ${object.status}`
    }

    const {
      teamId,
      // note,
      additionalSeats
    } = object.metadata
    let planId = object.metadata.planId
    let billingCycle = object.metadata.billingCycle

    // const invoice = await this.invoiceService.findById(invoiceId)
    const trialing = object.status === 'trialing'
    const team = await this.teamService.findWithPlanById(teamId)

    if (object.status === 'canceled') {
      // Removed Plunk service call for tracking user churn
    }

    // Payment for extra fee or changing to another plan
    if (helper.isValid(planId)) {
      // if (invoice) {
      //   await this.invoiceService.update(invoiceId, {
      //     teamId,
      //     planId,
      //     subscriptionId: object.id,
      //     note
      //   })
      // }

      const subscription: Record<string, any> = {
        id: object.id,
        planId,
        billingCycle: Number(billingCycle),
        startAt: object.current_period_start,
        endAt: object.current_period_end,
        trialing,
        status: SubscriptionStatusEnum.ACTIVE
      }
      const updates: Record<string, any> = {
        subscription
      }

      if (helper.isValid(additionalSeats)) {
        updates.additionalSeats = Number(additionalSeats)
      }

      if (trialing) {
        updates.trialEndAt = object.current_period_end
      }

      await this.teamService.update(teamId, updates)
    } else {
      // Renewal subscription
      // const freePlan = await this.planService.findByGrade(PlanGradeEnum.FREE)

      // New subscription
      if (object.plan?.id) {
        const plan = await this.planService.findByPriceId(object.plan!.id)

        if (!plan) {
          throw new BadRequestException('Invalid plan')
        }

        planId = plan?.id
        billingCycle = plan?.price?.billingCycle
      } else {
        planId = team.plan?.id
        billingCycle = team.subscription?.billingCycle
      }

      // await this.invoiceService.update(invoiceId, {
      //   teamId,
      //   planId,
      //   subscriptionId: object.id,
      //   billingCycle
      // })

      const isSubscriptionActive = true

      console.log(
        'Subscription id:%s, isActive: %s',
        team.subscription.id,
        JSON.stringify(isSubscriptionActive)
      )
      console.log('Webhook id: %s, status: %s', object.id, object.status)

      // Prevent multiple webhook conflicts
      if (isSubscriptionActive && object.status !== 'active') {
        return
      }

      const subscription: Record<string, any> = {
        id: object.id,
        planId,
        billingCycle,
        startAt: object.current_period_start,
        endAt: object.current_period_end,
        canceledAt: object.canceled_at,
        isCanceled: object.status === 'canceled',
        trialing,
        status: SUBSCRIPTION_STATUS[object.status]
      }
      const updates: Record<string, any> = {
        subscription
      }

      if (trialing) {
        updates.trialEndAt = object.current_period_end
      }

      await this.teamService.update(teamId, updates)
    }

    const _plan = await this.planService.findById(planId)

    const endsAt = unixDate(object.current_period_end).format('YYYY-MM-DD')
    const cCustomerStatus = trialing ? 'Trial' : 'Active'
    const description = `${_plan.name} Plan, ${
      BILLING_CYCLES[Number(billingCycle)]
    }, ends at ${endsAt}`

    if (team.crmAccountId) {
      this.queueService.addEspoCRMQueue({
        action: EspoCRMAction.UPDATE_ACCOUNT,
        id: team.crmAccountId,
        updates: {
          cCustomerStatus,
          description
        }
      })
    } else {
      const owner = await this.userService.findById(team.ownerId)

      this.queueService.addEspoCRMQueue({
        action: EspoCRMAction.CREATE_ACCOUNT,
        teamId: team.id,
        account: {
          name: owner.name,
          emailAddress: owner.email,
          cCustomerStatus,
          description
        }
      })
    }

    return 'Success'
  }
}
