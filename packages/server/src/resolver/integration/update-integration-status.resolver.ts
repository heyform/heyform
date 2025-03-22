/**
 * @program: servers
 * @description: Update Integration Settings
 * @author:
 * @date: 2021-06-15 10:50
 **/

import { Auth, FormGuard } from '@decorator'
import { UpdateIntegrationStatusInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { IntegrationService } from '@service'

@Resolver()
@Auth()
export class UpdateIntegrationStatusResolver {
  constructor(private readonly integrationService: IntegrationService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateIntegrationStatus(
    @Args('input')
    input: UpdateIntegrationStatusInput
  ): Promise<boolean> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )

    if (integration) {
      await this.integrationService.update(integration.id, {
        status: input.status
      })
    }

    return true
  }
}
