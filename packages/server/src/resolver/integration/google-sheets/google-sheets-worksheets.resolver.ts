/**
 * @program: servers
 * @description: Google Sheets Worksheets
 * @author: Mufeng
 * @date: 2021-06-15 14:37
 **/

import { Auth, FormGuard } from '@decorator'
import { GoogleSheetsWorksheetsInput } from '@graphql'
import { GoogleSheets } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'

@Resolver()
@Auth()
export class GoogleSheetsWorksheetsResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [String])
  @FormGuard()
  async googleSheetsWorksheets(
    @Args('input') input: GoogleSheetsWorksheetsInput
  ): Promise<string[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )
    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException(
        'Please connect a new account with Google Sheets'
      )
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException(
        'Please connect a new account with Google Sheets'
      )
    }

    const app = await this.appService.findById(input.appId)
    const googleSheets = GoogleSheets.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    const result = await googleSheets.worksheets(input.spreadsheet)
    return result.map(row => row.properties!.title)
  }
}
