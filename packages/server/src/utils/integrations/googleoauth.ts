/**
 * @program: heyform-integrations
 * @description: Google APIs
 * @author: Mufeng
 * @date: 2021-06-09 10:50
 **/

import { helper } from '@heyform-inc/utils'
const { isEmpty, isValid } = helper
import { Credentials, OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import {
  Integration,
  IntegrationConfig,
  IntegrationTokens,
  IntegrationUser
} from './integration'
import { mapToObject } from './utils'

export interface GoogleOAuthTokens extends IntegrationTokens {
  idToken?: string | null
}

export interface GoogleOAuthConfig extends IntegrationConfig {
  tokens?: GoogleOAuthTokens
}

export class GoogleOAuth extends Integration {
  tokens!: GoogleOAuthTokens
  oAuth2Client!: OAuth2Client

  constructor(config: GoogleOAuthConfig) {
    super(config)

    this.oAuth2Client = new google.auth.OAuth2({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri
    }) as any
  }

  static init(config: GoogleOAuthConfig): GoogleOAuth {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new GoogleOAuth(config)

    if (isValid(config.tokens) && isValid(config.tokens!.accessToken)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  static tokensToCredentials(tokens: GoogleOAuthTokens): Credentials {
    return {
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate! * 1_000,
      access_token: tokens.accessToken,
      id_token: tokens.idToken,
      token_type: tokens.tokenType,
      scope: tokens.scope
    }
  }

  static credentialsToTokens(credentials: Credentials): GoogleOAuthTokens {
    return {
      refreshToken: credentials.refresh_token,
      expiryDate: Math.floor(credentials.expiry_date! / 1_000),
      accessToken: credentials.access_token!,
      idToken: credentials.id_token!,
      tokenType: credentials.token_type,
      scope: Integration.parseScope(credentials.scope)
    }
  }

  async getToken(code: string): Promise<GoogleOAuthTokens> {
    const result = await this.oAuth2Client.getToken(code)
    return GoogleOAuth.credentialsToTokens(result.tokens)
  }

  async refreshAccessToken(): Promise<GoogleOAuthTokens> {
    const result = await this.oAuth2Client.refreshAccessToken()
    return GoogleOAuth.credentialsToTokens(result.credentials)
  }

  async verifyIdToken(idToken: string): Promise<IntegrationUser | undefined> {
    const ticket = await this.oAuth2Client.verifyIdToken({
      idToken,
      audience: this.clientId
    })
    const data = ticket.getPayload()

    if (isEmpty(data)) {
      return
    }

    return {
      openId: data!.sub!,
      user: {
        email: data!.email!.toLowerCase(),
        name: [data!.given_name, data!.family_name].filter(Boolean).join(' '),
        avatar: data!.picture
      }
    }
  }

  public async userInfo(): Promise<IntegrationUser> {
    const oauth2 = google.oauth2({
      version: 'v2',
      auth: this.oAuth2Client as any
    })
    const { data } = await oauth2.userinfo.get()

    if (isEmpty(data)) {
      throw new Error('Unable to obtain user information')
    }

    return {
      openId: data.id!,
      user: {
        email: data.email!.toLowerCase(),
        name: [data.given_name, data.family_name].filter(Boolean).join(' '),
        avatar: data.picture
      }
    }
  }

  setCredentials(tokens: GoogleOAuthTokens) {
    this.oAuth2Client.setCredentials(GoogleOAuth.tokensToCredentials(tokens))
  }

  generateAuthUrl(scope: string[] | string, state?: string) {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      // see https://github.com/googleapis/google-api-python-client/issues/213#issuecomment-612412147
      prompt: 'consent',
      scope,
      state
    })
  }
}
