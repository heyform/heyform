/**
 * @program: servers
 * @description: Monday oauth
 * @author: Mufeng
 * @date: 2021-06-29 10:19
 **/

import { Auth, FormGuard } from '@decorator'
import { ThirdPartyOAuthInput } from '@graphql'
import { Monday } from '@heyforms/integrations'
import { IntegrationStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Logger } from '@utils'

@Resolver()
@Auth()
export class MondayOauthResolver {
  private readonly logger!: Logger

  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {
    this.logger = new Logger(MondayOauthResolver.name)
  }

  @Mutation(returns => Boolean)
  @FormGuard()
  async mondayOauth(
    @Args('input') input: ThirdPartyOAuthInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    try {
      const monday = Monday.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        redirectUri: app.redirectUri
      })

      const tokens = await monday.getToken(input.code)
      monday.setCredentials(tokens)

      const userInfo = await monday.userInfo()
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
