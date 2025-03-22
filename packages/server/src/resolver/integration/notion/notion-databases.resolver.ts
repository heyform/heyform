import { Auth, FormGuard } from '@decorator'
import { AirtableTablesType, ThirdPartyInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Notion } from '@utils'

@Resolver()
@Auth()
export class NotionDatabasesResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [AirtableTablesType])
  @FormGuard()
  async notionDatabases(
    @Args('input') input: ThirdPartyInput
  ): Promise<AirtableTablesType[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )

    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException('Please connect a new account with Notion')
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException('Please connect a new account with Notion')
    }

    const app = await this.appService.findById(input.appId)
    const notion = Notion.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    return notion.databases()
  }
}
