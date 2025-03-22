/**
 * @program: servers
 * @description: Refresh access token
 * @author:
 * @date: 2021-06-10 16:34
 **/

import {
  Dropbox,
  GoogleOAuth,
  GoogleOAuthTokens,
  Hubspot,
  IntegrationTokens
} from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { AppInternalTypeEnum, IntegrationStatusEnum } from '@model'
import { Process, Processor } from '@nestjs/bull'
import {
  AppService,
  FailedTaskService,
  IntegrationService,
  ThirdPartyService
} from '@service'
import { mapToObject } from '@heyforms/integrations'
import { Airtable } from '@utils'
import { BaseQueue } from '../queue/base.queue'

@Processor('RefreshThirdPartyOauthSchedule')
export class RefreshThirdPartyOauthSchedule extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly appService: AppService,
    private readonly integrationService: IntegrationService,
    private readonly thirdPartyService: ThirdPartyService
  ) {
    super(failedTaskService)
  }

  @Process()
  async refreshThirdPartyOauth() {
    const apps = await this.appService.findAllByInternalType(
      AppInternalTypeEnum.THIRD_PARTY_OAUTH
    )

    for (const app of apps) {
      const result = await this.thirdPartyService.findAllExpired(app.id)

      for (const oauth of result) {
        try {
          let tokens: IntegrationTokens

          switch (app.uniqueId) {
            case 'googledrive':
            case 'googlesheets':
              const googleOAuth = GoogleOAuth.init({
                clientId: app.clientId,
                clientSecret: app.clientSecret,
                redirectUri: app.redirectUri,
                tokens: oauth.tokens as GoogleOAuthTokens
              })
              tokens = await googleOAuth.refreshAccessToken()
              break

            case 'hubspot':
              const hubspot = Hubspot.init({
                clientId: app.clientId,
                clientSecret: app.clientSecret,
                tokens: oauth.tokens as any
              })
              tokens = await hubspot.refreshAccessToken()
              break

            case 'dropbox':
              const dropbox = Dropbox.init({
                clientId: app.clientId,
                clientSecret: app.clientSecret,
                tokens: oauth.tokens as any
              })
              tokens = await dropbox.refreshAccessToken()
              break

            case 'airtable':
              const airtable = Airtable.init({
                clientId: app.clientId,
                clientSecret: app.clientSecret,
                tokens: oauth.tokens as any
              })
              tokens = await airtable.refreshAccessToken()
              break
          }

          if (helper.isValid(tokens)) {
            await this.thirdPartyService.update(oauth.id, {
              tokens: {
                ...mapToObject(oauth.tokens),
                ...tokens
              }
            })

            await this.integrationService.updateAllBy(
              {
                appId: app.id,
                thirdPartyOauthId: oauth.id
              },
              {
                status: IntegrationStatusEnum.ACTIVE
              }
            )
          }
        } catch (err) {
          // 如果 refresh token 失败，则禁用此 integration
          await this.integrationService.updateAllBy(
            {
              appId: app.id,
              thirdPartyOauthId: oauth.id
            },
            {
              status: IntegrationStatusEnum.DISABLED
            }
          )
          // await this.thirdPartyService.delete(oauth.id)

          this.logger.error(err.message, err.stack)
        }
      }
    }
  }
}
