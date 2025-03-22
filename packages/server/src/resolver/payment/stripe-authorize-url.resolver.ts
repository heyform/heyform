import { Auth, FormGuard, User } from '@decorator'
import { FormDetailInput } from '@graphql'
import { nanoid } from '@heyform-inc/utils'
import { UserModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { PaymentService, RedisService } from '@service'

@Resolver()
@Auth()
export class StripeAuthorizeUrlResolver {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly redisService: RedisService
  ) {}

  @Query(returns => String)
  @FormGuard()
  async stripeAuthorizeUrl(
    @User() user: UserModel,
    @Args('input') input: FormDetailInput
  ): Promise<string> {
    const state = nanoid()
    const key = `connect:stripe:${state}`

    // 保存 state 1小时
    await this.redisService.set({
      key,
      value: input.formId,
      duration: '1h'
    })

    return this.paymentService.getAuthorizeUrl(state, user.email)
  }
}
