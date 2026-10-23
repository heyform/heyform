import { BadRequestException } from '@nestjs/common'

import { Auth, Form, FormGuard } from '@decorator'
import { AppSettingOptionType, IntegrationSettingOptionsInput } from '@graphql'
import { FormModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationAuthService, IntegrationService } from '@service'

import { loadSettingOptions } from '../../apps/load-options'

/**
 * The options of a select setting that loads them from the app's service,
 * e.g. the tabs of a spreadsheet, with the key or account being picked.
 */
@Resolver()
@Auth()
export class IntegrationSettingOptionsResolver {
  constructor(
    private readonly appService: AppService,
    private readonly integrationService: IntegrationService,
    private readonly integrationAuthService: IntegrationAuthService
  ) {}

  @Query(returns => [AppSettingOptionType])
  @FormGuard()
  async integrationSettingOptions(
    @Args('input') input: IntegrationSettingOptionsInput,
    @Form() form: FormModel
  ): Promise<AppSettingOptionType[]> {
    const app = this.appService.findById(input.appId)

    if (!app || !this.appService.isAvailable(app)) {
      throw new BadRequestException('The app is not available on this server')
    }

    const integration = await this.integrationService.findOne(form.id, app.id)
    const connection =
      app.auth.type === 'oauth2'
        ? await this.integrationAuthService.findUsableConnection(
            app,
            form.teamId,
            input.connectionId || integration?.connectionId
          )
        : undefined

    return loadSettingOptions(app, input.setting, input.config, fn =>
      this.integrationAuthService.withSettingsAuth(
        app,
        { apiKey: input.apiKey, integration, connection },
        fn
      )
    )
  }
}
