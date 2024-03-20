import { Args, Query, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { FormDetailInput, FormIntegrationType } from '@graphql'
import { IntegrationModel } from '@model'
import { IntegrationService } from '@service'

@Resolver()
@Auth()
export class FormIntegrationsResolver {
  constructor(private readonly integrationService: IntegrationService) {}

  @Query(returns => [FormIntegrationType])
  @FormGuard()
  async formIntegrations(@Args('input') input: FormDetailInput): Promise<IntegrationModel[]> {
    return this.integrationService.findAllInForm(input.formId)
  }
}
