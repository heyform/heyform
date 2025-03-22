import { Auth, Team, TeamGuard, User } from '@decorator'
import { PaymentInput, PaymentType } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { PlanGradeEnum, PlanPriceTypeEnum, TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { PaymentService, PlanService } from '@service'

@Resolver()
@Auth()
export class PaymentResolver {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly planService: PlanService
  ) {}

  @Mutation(returns => PaymentType)
  @TeamGuard()
  async payment(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: PaymentInput
  ): Promise<PaymentType> {
    const { subscription } = team
    let promotionCodeId: string

    // Check if promotion code is valid
    if (helper.isValid(input.code)) {
      const promotionCode = await this.paymentService.validateCouponCode(
        input.planId,
        input.code,
        input.billingCycle
      )

      const planPrice = await this.planService.findPlanPriceBy({
        type: PlanPriceTypeEnum.PLAN,
        planId: input.planId,
        billingCycle: input.billingCycle
      })

      // Handle promotion code 100% discount
      if (
        promotionCode.coupon.percent_off === 100 ||
        promotionCode.coupon.amount_off >= planPrice.price * 100
      ) {
        await this.paymentService.createSubscription({
          teamId: team.id,
          email: user.email,
          promotionCodeId: promotionCode.id,
          planId: input.planId,
          billingCycle: input.billingCycle
        })

        return {}
      }

      promotionCodeId = promotionCode.id
    }

    // Create subscription
    // 1. 从 Basic Plan 升级，或者续费过期的订阅
    // 2. 当前 subscription 状态是 canceled/incomplete_expired
    const isInactive = await this.paymentService.isInactiveSubscription(
      subscription
    )

    if (isInactive) {
      const plan = await this.planService.findById(input.planId)

      if (plan.grade !== PlanGradeEnum.FREE) {
        const sessionUrl = await this.paymentService.createCheckoutSession({
          team,
          email: user.email,
          planId: input.planId,
          billingCycle: input.billingCycle,
          promotionCodeId
        })

        return {
          sessionUrl
        }
      }
    }

    // Upgrade or downgrade subscription
    await this.paymentService.changeSubscription({
      team,
      planId: input.planId,
      billingCycle: input.billingCycle,
      promotionCodeId
    })

    return {}
  }
}
