/**
 * @program: heyform-serves
 * @description: Dropbox folders
 * @author: mufeng
 * @date: 11/2/21 10:04 AM
 **/

import { Args, Query, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard } from '@decorator'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { GoogleDriveType, ThirdPartyInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Dropbox } from '@heyforms/integrations'

@Resolver()
@Auth()
export class DropboxFoldersResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [GoogleDriveType])
  @FormGuard()
  async dropboxFolders(
    @Args('input') input: ThirdPartyInput
  ): Promise<GoogleDriveType[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )
    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException('Please connect a new account with Dropbox')
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException('Please connect a new account with Dropbox')
    }

    const app = await this.appService.findById(input.appId)
    const dropbox = Dropbox.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    const result = await dropbox.folders()
    return result || []
  }
}
