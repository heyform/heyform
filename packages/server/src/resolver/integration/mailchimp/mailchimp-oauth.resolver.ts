/**
 * @program: servers
 * @description: Mailchimp OAuth
 * @author: Mufeng
 * @date: 2021-06-15 10:19
 **/

import { Auth, FormGuard } from '@decorator'
import { ThirdPartyOAuthInput } from '@graphql'
import { Mailchimp } from '@heyforms/integrations'
import { IntegrationStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Logger } from '@utils'

@Resolver()
@Auth()
export class MailchimpOauthResolver {
  private readonly logger!: Logger

  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {
    this.logger = new Logger(MailchimpOauthResolver.name)
  }

  @Mutation(returns => Boolean)
  @FormGuard()
  async mailchimpOauth(
    @Args('input') input: ThirdPartyOAuthInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    try {
      const mailchimp = Mailchimp.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        redirectUri: app.redirectUri
      })

      const tokens = await mailchimp.getToken(input.code)
      mailchimp.setCredentials(tokens)

      // 获取用户服务器信息
      const metadata = await mailchimp.getMetadata()
      tokens.server = metadata.dc

      const openId = (metadata.user_id as unknown) as string
      const updates = {
        user: metadata,
        tokens
      }
      const thirdPartyOauthId = await this.thirdPartyService.createOrUpdate(
        app.id,
        openId,
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
