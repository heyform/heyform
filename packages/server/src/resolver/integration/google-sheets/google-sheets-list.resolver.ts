/**
 * @program: servers
 * @description: Google Sheets List
 * @author: Mufeng
 * @date: 2021-06-15 14:37
 **/

import { Auth, FormGuard } from '@decorator'
import { GoogleDriveFileType, GoogleDriveFoldersInput } from '@graphql'
import { GoogleDrive } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'
import { drive_v3 } from 'googleapis'

@Resolver()
@Auth()
export class GoogleSheetsListResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [GoogleDriveFileType])
  @FormGuard()
  async googleSheetsList(
    @Args('input') input: GoogleDriveFoldersInput
  ): Promise<drive_v3.Schema$File[]> {
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
    const googleDrive = GoogleDrive.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })

    let driveId: string | undefined

    if (helper.isValid(input.drive) && input.drive !== '__ALL_DRIVE__') {
      driveId = input.drive
    }

    const result = await googleDrive.spreadsheets({
      driveId
    })
    return result.files || []
  }
}
