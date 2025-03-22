/**
 * @program: servers
 * @description: Update Integration Settings
 * @author:
 * @date: 2021-06-15 10:50
 **/

import { Auth, FormGuard } from '@decorator'
import { UpdateIntegrationInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { IntegrationStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService } from '@service'

@Resolver()
@Auth()
export class UpdateIntegrationSettingsResolver {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateIntegrationSettings(
    @Args('input')
    input: UpdateIntegrationInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    const attributes = input[app.uniqueId]

    if (helper.isEmpty(attributes)) {
      throw new BadRequestException('Invalid attributes arguments')
    }

    await this.integrationService.createOrUpdate(input.formId, app.id, {
      attributes,
      status: IntegrationStatusEnum.ACTIVE
    })

    return true
  }
}
