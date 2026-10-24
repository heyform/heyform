import { BadRequestException } from '@nestjs/common'

import { validateAppConfig } from '../../apps/validate-config'
import { Auth, Form, FormGuard } from '@decorator'
import { UpdateIntegrationInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import {
  FormModel,
  IntegrationConnectionModel,
  IntegrationConnectionStatusEnum,
  IntegrationModel,
  IntegrationStatusEnum
} from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationAuthService, IntegrationService } from '@service'
import { GraphQLJSONObject } from 'graphql-type-json'

@Resolver()
@Auth()
export class UpdateIntegrationSettingsResolver {
  constructor(
    private readonly appService: AppService,
    private readonly integrationService: IntegrationService,
    private readonly integrationAuthService: IntegrationAuthService
  ) {}

  // Returns the config as stored, which the app's validate may have changed
  // (e.g. a spreadsheet it created), so the client never keeps what was typed
  @Mutation(returns => GraphQLJSONObject)
  @FormGuard()
  async updateIntegrationSettings(
    @Args('input')
    input: UpdateIntegrationInput,
    @Form() form?: FormModel
  ): Promise<Record<string, any>> {
    const app = this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    if (!this.appService.isAvailable(app)) {
      throw new BadRequestException(`${app.name} is not available on this server`)
    }

    if (helper.isEmpty(input.config)) {
      throw new BadRequestException('Invalid attributes arguments')
    }

    const integration = await this.integrationService.findOne(input.formId, app.id)
    const updates: Partial<IntegrationModel> = {
      status: IntegrationStatusEnum.ACTIVE
    }
    let apiKey: string | undefined
    let connection: IntegrationConnectionModel | undefined

    if (app.auth.type === 'apiKey') {
      apiKey = input.apiKey?.trim()

      if (apiKey) {
        Object.assign(updates, this.integrationAuthService.encryptApiKey(apiKey))
      } else if (!integration?.apiKey) {
        throw new BadRequestException(`${app.auth.label || 'API key'} is required`)
      } else if (integration.status === IntegrationStatusEnum.NEEDS_RECONNECT) {
        // The saved key can't be used; only entering it again fixes that
        updates.status = IntegrationStatusEnum.NEEDS_RECONNECT
      }
    }

    if (app.auth.type === 'oauth2') {
      // Any of the team's accounts, whoever connected it
      connection = await this.integrationAuthService.findUsableConnection(
        app,
        form?.teamId ?? '',
        input.connectionId || integration?.connectionId
      )

      updates.connectionId = connection.id

      // Saving settings doesn't fix a revoked grant; only reconnecting the
      // account, or picking another one, does
      if (connection.status === IntegrationConnectionStatusEnum.NEEDS_RECONNECT) {
        updates.status = IntegrationStatusEnum.NEEDS_RECONNECT
      }
    }

    // The app's validate may check the config with the key or account
    // being saved
    updates.config = await validateAppConfig(app, input.config, {
      form: form!,
      withAuth:
        app.auth.type === 'none'
          ? undefined
          : fn =>
              this.integrationAuthService.withSettingsAuth(
                app,
                { apiKey, integration, connection },
                fn
              )
    })

    const integrationId = await this.integrationService.createOrUpdate(
      input.formId,
      app.id,
      updates
    )

    // e.g. a new API key: send what arrived while it needed reconnecting
    if (updates.status === IntegrationStatusEnum.ACTIVE) {
      await this.integrationService.resendWaiting({
        id: integrationId,
        formId: input.formId,
        appId: app.id
      })
    }

    return updates.config
  }
}
