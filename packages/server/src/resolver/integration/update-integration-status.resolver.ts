import { BadRequestException } from '@nestjs/common'

import { Auth, FormGuard } from '@decorator'
import { UpdateIntegrationStatusInput } from '@graphql'
import { IntegrationStatusEnum } from '@model'
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
    const integration = await this.integrationService.findOne(input.formId, input.appId)

    if (integration) {
      // Turning it back on would only fail every delivery until the account
      // is reconnected, which restores the status itself
      if (
        integration.status === IntegrationStatusEnum.NEEDS_RECONNECT &&
        input.status === IntegrationStatusEnum.ACTIVE
      ) {
        throw new BadRequestException('Reconnect the account to turn this integration on')
      }

      await this.integrationService.update(integration.id, {
        status: input.status
      })

      // Submissions kept while it needed reconnecting, if it was turned off
      // before being reconnected
      if (input.status === IntegrationStatusEnum.ACTIVE) {
        await this.integrationService.resendWaiting(integration)
      }
    }

    return true
  }
}
