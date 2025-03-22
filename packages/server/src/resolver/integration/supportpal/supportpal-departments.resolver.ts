import { Auth, FormGuard } from '@decorator'
import { SupportPalInput, SupportPalType } from '@graphql'
import { SupportPal } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class SupportpalDepartmentsResolver {
  @Query(returns => [SupportPalType])
  @FormGuard()
  async supportpalDepartments(
    @Args('input') input: SupportPalInput
  ): Promise<any[]> {
    const supportPal = SupportPal.init({
      supportPalBaseUri: input.systemURL,
      clientSecret: input.token
    })
    return supportPal.departments()
  }
}
