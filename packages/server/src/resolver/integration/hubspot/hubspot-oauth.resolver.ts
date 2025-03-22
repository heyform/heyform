/**
 * @program: servers
 * @description: Hubspot oauth
 * @author: Mufeng
 * @date: 2021-06-29 10:19
 **/

import { Auth, FormGuard } from '@decorator'
import { ThirdPartyOAuthInput } from '@graphql'
import { Hubspot } from '@heyforms/integrations'
import { IntegrationStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Logger } from '@utils'

@Resolver()
@Auth()
export class HubspotOauthResolver {
  private readonly logger!: Logger

  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {
    this.logger = new Logger(HubspotOauthResolver.name)
  }

  @Mutation(returns => Boolean)
  @FormGuard()
  async hubspotOauth(
    @Args('input') input: ThirdPartyOAuthInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    try {
      const hubspot = Hubspot.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        redirectUri: app.redirectUri
      })

      const tokens = await hubspot.getToken(input.code)
      hubspot.setCredentials(tokens)

      const userInfo = await hubspot.userInfo()
      const updates = {
        tokens,
        ...userInfo
      }

      const thirdPartyOauthId = await this.thirdPartyService.createOrUpdate(
        app.id,
        updates.openId,
        tokens.scope,
        updates
      )
      await this.integrationService.createOrUpdate(input.formId, app.id, {
        thirdPartyOauthId,
        status: IntegrationStatusEnum.DISABLED
      })
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.message)
    }

    return true
  }
}
