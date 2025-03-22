/**
 * @program: heyform-serves
 * @description: Dropbox oauth
 * @author: mufeng
 * @date: 11/2/21 10:04 AM
 **/

import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard } from '@decorator'
import { Logger } from '@utils'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { ThirdPartyOAuthInput } from '@graphql'
import { BadRequestException } from '@nestjs/common'
import { Dropbox } from '@heyforms/integrations'
import { IntegrationStatusEnum } from '@model'

@Resolver()
@Auth()
export class DropboxOauthResolver {
  private readonly logger!: Logger

  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {
    this.logger = new Logger(DropboxOauthResolver.name)
  }

  @Mutation(returns => Boolean)
  @FormGuard()
  async dropboxOauth(
    @Args('input') input: ThirdPartyOAuthInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    try {
      const dropbox = Dropbox.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        redirectUri: app.redirectUri
      })

      const tokens = await dropbox.getToken(input.code)
      dropbox.setCredentials(tokens)

      const userInfo = await dropbox.userInfo()
      const updates = {
        tokens,
        ...userInfo
      }

      const thirdPartyOauthId = await this.thirdPartyService.createOrUpdate(
        app.id,
        userInfo.openId,
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
