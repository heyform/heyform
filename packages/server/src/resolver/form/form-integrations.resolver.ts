import { Auth, FormGuard } from '@decorator'
import { FormDetailInput, FormIntegrationType } from '@graphql'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { IntegrationService } from '@service'

@Resolver()
@Auth()
export class FormIntegrationsResolver {
  constructor(private readonly integrationService: IntegrationService) {}

  @Query(returns => [FormIntegrationType])
  @FormGuard()
  async formIntegrations(@Args('input') input: FormDetailInput): Promise<FormIntegrationType[]> {
    const integrations = await this.integrationService.findAllInForm(input.formId)

    // Pick fields explicitly so stored credentials can't reach the client
    return Promise.all(
      integrations.map(async integration => ({
        formId: integration.formId,
        appId: integration.appId,
        config: integration.config,
        status: integration.status,
        connected: !!integration.connectionId,
        connectionId: integration.connectionId,
        apiKeyHint: integration.apiKeyHint,
        waitingCount: await this.integrationService.countWaiting(integration.id)
      }))
    )
  }
}
