/**
 * @program: servers
 * @description: Google Drive List
 * @author: Mufeng
 * @date: 2021-06-15 14:37
 **/

import { Auth, FormGuard } from '@decorator'
import { GoogleDriveType, ThirdPartyInput } from '@graphql'
import { GoogleDrive } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { drive_v3 } from 'googleapis'

@Resolver()
@Auth()
export class GoogleDriveListResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [GoogleDriveType])
  @FormGuard()
  async googleDriveList(
    @Args('input') input: ThirdPartyInput
  ): Promise<drive_v3.Schema$Drive[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )
    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException(
        'Please connect a new account with Google Drive'
      )
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException(
        'Please connect a new account with Google Drive'
      )
    }

    const app = await this.appService.findById(input.appId)
    const googleDrive = GoogleDrive.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    const result = await googleDrive.drives()

    return result.map(d => ({
      id: helper.isEmpty(d.id) ? '__ALL_DRIVE__' : d.id,
      name: d.name
    }))
  }
}
