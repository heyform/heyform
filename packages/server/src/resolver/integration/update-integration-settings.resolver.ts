import { BadRequestException } from '@nestjs/common'

import { validateAppConfig } from '../../apps/validate-config'
import { Auth, FormGuard } from '@decorator'
import { UpdateIntegrationInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { IntegrationStatusEnum } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService } from '@service'

@Resolver()
@Auth()
export class UpdateIntegrationSettingsResolver {
  constructor(
    private readonly appService: AppService,
    private readonly integrationService: IntegrationService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateIntegrationSettings(
    @Args('input')
    input: UpdateIntegrationInput
  ): Promise<boolean> {
    const app = this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    if (helper.isEmpty(input.config)) {
      throw new BadRequestException('Invalid attributes arguments')
    }

    const config = await validateAppConfig(app, input.config)

    await this.integrationService.createOrUpdate(input.formId, app.id, {
      config,
      status: IntegrationStatusEnum.ACTIVE
    })

    return true
  }
}
