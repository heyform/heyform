import { Auth, Team, TeamGuard } from '@decorator'
import { AdditionalSeatInput, PaymentType } from '@graphql'
import { TeamModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { PaymentService } from '@service'

@Resolver()
@Auth()
export class AdditionalSeatResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(returns => PaymentType)
  @TeamGuard()
  async additionalSeat(
    @Team() team: TeamModel,
    @Args('input') input: AdditionalSeatInput
  ): Promise<PaymentType> {
    const note = await this.paymentService.changeSubscription({
      team,
      planId: team.plan.id,
      billingCycle: team.subscription.billingCycle,
      additionalSeats: input.additionalSeats
    })

    return {
      note
    }
  }
}
