import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, Team, TeamGuard } from '@decorator'
import { TeamModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { PaymentService } from '@service'
import { TeamDetailInput } from '@graphql'

@Resolver()
@Auth()
export class StripeCustomerPortalResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(returns => String)
  @TeamGuard()
  async stripeCustomerPortal(
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<string> {
    if (!team.subscription?.id) {
      throw new BadRequestException('The subscription cannot be found')
    }

    const subscription = await this.paymentService.subscription(
      team.subscription.id
    )

    if (!subscription) {
      throw new BadRequestException('The subscription cannot be found')
    }

    const result = await this.paymentService.createCustomPortal(
      input.teamId,
      subscription.customer as string
    )

    return result.url
  }
}
