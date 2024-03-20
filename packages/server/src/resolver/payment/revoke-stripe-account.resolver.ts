import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { FormDetailInput } from '@graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class RevokeStripeAccountResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async revokeStripeAccount(@Args('input') input: FormDetailInput): Promise<boolean> {
    return this.formService.update(input.formId, {
      stripeAccount: undefined
    })
  }
}
