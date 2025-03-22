import { Auth, FormGuard } from '@decorator'
import { SupportPalInput, SupportPalType } from '@graphql'
import { SupportPal } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class SupportpalStatusResolver {
  @Query(returns => [SupportPalType])
  @FormGuard()
  async supportpalStatus(
    @Args('input') input: SupportPalInput
  ): Promise<any[]> {
    const supportPal = SupportPal.init({
      supportPalBaseUri: input.systemURL,
      clientSecret: input.token
    })
    return supportPal.status()
  }
}
