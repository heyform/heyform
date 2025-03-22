import { Auth, FormGuard } from '@decorator'
import { SupportPalPrioritiesInput, SupportPalType } from '@graphql'
import { SupportPal } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class SupportpalPrioritiesResolver {
  @Query(returns => [SupportPalType])
  @FormGuard()
  async supportpalPriorities(
    @Args('input') input: SupportPalPrioritiesInput
  ): Promise<any[]> {
    const supportPal = SupportPal.init({
      supportPalBaseUri: input.systemURL,
      clientSecret: input.token
    })
    return supportPal.priorities(input.departmentId)
  }
}
