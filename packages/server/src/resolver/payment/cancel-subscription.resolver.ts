import { Auth, Team, TeamGuard, User } from '@decorator'
import { TeamDetailInput } from '@graphql'
import { timestamp } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { PaymentService, TeamService } from '@service'

@Resolver()
@Auth()
export class CancelSubscriptionResolver {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly teamService: TeamService
  ) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async cancelSubscription(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: TeamDetailInput
  ): Promise<boolean> {
    const { subscription } = team

    await this.paymentService.cancelSubscription(subscription.id)
    await this.teamService.update(input.teamId, {
      'subscription.id': null,
      'subscription.isCanceled': true,
      'subscription.canceledAt': timestamp()
    })

    return true
  }
}
