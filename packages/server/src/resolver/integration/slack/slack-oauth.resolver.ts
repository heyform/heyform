/**
 * @program: servers
 * @description: Google OAuth
 * @author: Mufeng
 * @date: 2021-06-15 10:19
 **/

import { Auth, ClientInfo, FormGuard, GqlClient } from '@decorator'
import { ThirdPartyOAuthInput } from '@graphql'
import { IntegrationStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Slack, Logger } from '@utils'

@Resolver()
@Auth()
export class SlackOauthResolver {
  private readonly logger!: Logger

  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {
    this.logger = new Logger(SlackOauthResolver.name)
  }

  @Mutation(returns => Boolean)
  @FormGuard()
  async slackOauth(
    @GqlClient() client: ClientInfo,
    @Args('input') input: ThirdPartyOAuthInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    try {
      const slackOAuth = Slack.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        redirectUri: app.redirectUri
      })

      const tokens = await slackOAuth.getToken(input.code)
      slackOAuth.setCredentials(tokens)

      const updates = {
        tokens,
        ...tokens.userInfo
      }

      const thirdPartyOauthId = await this.thirdPartyService.createOrUpdate(
        app.id,
        tokens.userInfo.openId,
        tokens.scope,
        updates
      )
      await this.integrationService.createOrUpdate(input.formId, app.id, {
        thirdPartyOauthId,
        status: IntegrationStatusEnum.PENDING
      })
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.message)
    }

    return true
  }
}
