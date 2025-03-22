/**
 * @program: servers
 * @description: App authorization url
 * @author: Mufeng
 * @date: 2021-06-11 13:15
 **/

import { Auth, ClientInfo, GqlClient } from '@decorator'
import { ThirdPartyInput } from '@graphql'
import {
  Dropbox,
  Github,
  GoogleOAuth,
  Hubspot,
  Mailchimp,
  Monday
} from '@heyforms/integrations'
import { AppInternalTypeEnum, AppModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService } from '@service'
import { Airtable, Notion, Slack } from '@utils'

@Resolver()
@Auth()
export class ThirdPartyOauthUrlResolver {
  constructor(private readonly appService: AppService) {}

  @Query(returns => String)
  async thirdPartyOauthUrl(
    @GqlClient() client: ClientInfo,
    @Args('input') input: ThirdPartyInput
  ) {
    const app = await this.appService.findById(input.appId)

    if (app?.internalType !== AppInternalTypeEnum.THIRD_PARTY_OAUTH) {
      return null
    }

    return this.generateAuthUrl(app, client.deviceId)
  }

  private async generateAuthUrl(
    app: AppModel,
    deviceId: string
  ): Promise<string | String | undefined> {
    if (app.uniqueId === 'mailchimp') {
      const mailchimp = Mailchimp.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })
      return mailchimp.generateAuthUrl()
    }

    // Google
    else if (
      app.uniqueId === 'googledrive' ||
      app.uniqueId === 'googlesheets'
    ) {
      const googleOAuth = GoogleOAuth.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })

      return googleOAuth.generateAuthUrl(app.scope)
    }

    // Hubspot
    else if (app.uniqueId === 'hubspot') {
      const hubspot = Hubspot.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })

      return hubspot.generateAuthUrl(app.scope)
    }

    // Monday
    else if (app.uniqueId === 'monday') {
      const monday = Monday.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })
      return monday.generateAuthUrl()
    }

    // Github
    else if (app.uniqueId === 'github') {
      const github = Github.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })
      return github.generateAuthUrl()
    }

    // Dropbox
    else if (app.uniqueId === 'dropbox') {
      const dropbox = Dropbox.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })
      return dropbox.generateAuthUrl()
    }

    // Airtable
    else if (app.uniqueId === 'airtable') {
      const airtable = Airtable.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })

      return airtable.generateAuthUrl(app.scope, deviceId)
    }

    // Slack
    else if (app.uniqueId === 'slack') {
      const slack = Slack.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })

      return slack.generateAuthUrl(app.scope, app.userScope, deviceId)
    }

    // Notion
    else if (app.uniqueId === 'notion') {
      const notion = Notion.init({
        clientId: app.clientId,
        redirectUri: app.redirectUri
      })

      return notion.generateAuthUrl()
    }
  }
}
