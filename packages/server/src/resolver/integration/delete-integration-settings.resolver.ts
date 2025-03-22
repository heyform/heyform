/**
 * @program: servers
 * @description: Update Integration Settings
 * @author:
 * @date: 2021-06-15 10:50
 **/

import { Auth, FormGuard } from '@decorator'
import { ThirdPartyInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { IntegrationService } from '@service'

@Resolver()
@Auth()
export class DeleteIntegrationSettingsResolver {
  constructor(private readonly integrationService: IntegrationService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async deleteIntegrationSettings(
    @Args('input')
    input: ThirdPartyInput
  ): Promise<boolean> {
    return this.integrationService.delete(input.formId, input.appId)
  }
}
