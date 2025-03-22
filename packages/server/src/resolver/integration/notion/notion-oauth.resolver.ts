import { Auth, FormGuard } from '@decorator'
import { ThirdPartyOAuthInput } from '@graphql'
import { IntegrationStatusEnum } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Logger, Notion } from '@utils'

@Resolver()
@Auth()
export class NotionOauthResolver {
  private readonly logger!: Logger

  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {
    this.logger = new Logger(NotionOauthResolver.name)
  }

  @Mutation(returns => Boolean)
  @FormGuard()
  async notionOauth(
    @Args('input') input: ThirdPartyOAuthInput
  ): Promise<boolean> {
    const app = await this.appService.findById(input.appId)

    if (!app) {
      throw new BadRequestException('The app does not exist')
    }

    try {
      const notion = Notion.init({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        redirectUri: app.redirectUri
      })

      const tokens = await notion.getToken(input.code)
      notion.setCredentials(tokens)

      const thirdPartyOauthId = await this.thirdPartyService.createOrUpdate(
        app.id,
        tokens.userInfo.openId,
        '',
        {
          tokens
        }
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
