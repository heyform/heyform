/**
 * @program: servers
 * @description: GitHub OAuth
 * @author: Mufeng
 * @date: 2021-10-28 10:19
 **/

import { Auth, FormGuard } from '@decorator'
import { ThirdPartyOAuthInput } from '@graphql'
import { Github } from '@heyforms/integrations'
import { IntegrationStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Logger } from '@utils'

@Resolver()
@Auth()
export class GithubOauthResolver {
  private readonly logger!: Logger

  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {
    this.logger = new Logger(GithubOauthResolver.name)
  }

  @Mutation(returns => Boolean)
  @FormGuard()
  async githubOauth(
    @Args('input') input: ThirdPartyOAuthInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    try {
      const github = Github.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        redirectUri: app.redirectUri
      })

      const tokens = await github.getToken(input.code)
      github.setCredentials(tokens)

      // 获取用户服务器信息
      const userInfo = await github.userInfo()
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
