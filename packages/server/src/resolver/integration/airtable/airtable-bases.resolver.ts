/**
 * @program: servers
 * @description: Google Drive Folders
 * @author: Mufeng
 * @date: 2021-06-15 14:37
 **/

import { Auth, FormGuard } from '@decorator'
import { AirtableBaseType, ThirdPartyInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { Airtable } from '@utils'

@Resolver()
@Auth()
export class AirtableBasesResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [AirtableBaseType])
  @FormGuard()
  async airtableBases(
    @Args('input') input: ThirdPartyInput
  ): Promise<AirtableBaseType[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )
    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException(
        'Please connect a new account with Airtable'
      )
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException(
        'Please connect a new account with Airtable'
      )
    }

    const app = await this.appService.findById(input.appId)
    const airtable = Airtable.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens
    })

    return airtable.bases()
  }
}
