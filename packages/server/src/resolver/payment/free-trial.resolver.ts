import { Auth, Team, TeamGuard, User } from '@decorator'
import { FREE_TRIAL_DAYS } from '@environments'
import { FreeTrialInput } from '@graphql'
import { BillingCycleEnum, PlanGradeEnum, TeamModel, UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { PaymentService, PlanService } from '@service'

@Resolver()
@Auth()
export class FreeTrialResolver {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly planService: PlanService
  ) {}

  @Mutation(returns => String)
  @TeamGuard()
  async freeTrial(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: FreeTrialInput
  ): Promise<string> {
    if (team.trialEndAt > 0) {
      throw new BadRequestException('Unable to start the free trial')
    }

    if (team.plan.grade > PlanGradeEnum.FREE) {
      throw new BadRequestException(
        'Unable to start the free trial for subscribed workspace'
      )
    }

    const plan = await this.planService.findById(input.planId)

    if (!plan || plan.grade <= PlanGradeEnum.FREE) {
      throw new BadRequestException('Invalid plan for the free trial')
    }

    return this.paymentService.createCheckoutSession({
      team,
      email: user.email,
      planId: plan.id,
      billingCycle: BillingCycleEnum.MONTHLY,
      freeTrial: FREE_TRIAL_DAYS
    })
  }
}
