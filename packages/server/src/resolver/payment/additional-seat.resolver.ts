import { Auth, TeamGuard } from '@decorator'
import { AdditionalSeatInput, PaymentType } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class AdditionalSeatResolver {
  @Mutation(returns => PaymentType)
  @TeamGuard()
  async additionalSeat(
    // @Team() team: TeamModel,
    @Args('input') input: AdditionalSeatInput
  ): Promise<PaymentType> {
    // const note = await this.paymentService.changeSubscription({
    //   team,
    //   planId: team.plan.id,
    //   billingCycle: team.subscription?.billingCycle,
    //   additionalSeats: input.additionalSeats
    // })

    const note = ''

    return {
      note
    }
  }
}
