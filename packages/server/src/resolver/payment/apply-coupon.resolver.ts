import { Auth, Team, TeamGuard, User } from '@decorator'
import { ApplyCouponInput, ApplyCouponType } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { PaymentService } from '@service'

@Resolver()
@Auth()
export class ApplyCouponResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Query(returns => ApplyCouponType)
  @TeamGuard()
  async applyCoupon(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: ApplyCouponInput
  ): Promise<ApplyCouponType> {
    const promotionCode = await this.paymentService.validateCouponCode(
      input.planId,
      input.code,
      input.billingCycle
    )

    return {
      id: promotionCode.id,
      amountOff: promotionCode.coupon.amount_off,
      percentOff: promotionCode.coupon.percent_off
    }
  }
}
