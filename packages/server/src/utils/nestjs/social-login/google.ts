import { helper } from '@heyform-inc/utils'
import { ServiceUnavailableException } from '@nestjs/common'
import { Credentials } from 'google-auth-library'
import { google } from 'googleapis'
import { formatLocale } from '../utils/locale'
import { UserInfo } from './apple'

export interface GoogleSocialLoginOptions {
  clientId: string
  clientSecret: string
  redirectUrl: string
  state?: string
}

export class GoogleSocialLogin {
  private readonly options!: GoogleSocialLoginOptions

  constructor(options: GoogleSocialLoginOptions) {
    this.options = options
  }

  public getAuthUrl(): string {
    const oauth2Client = this.getOauth2Client()
    return oauth2Client.generateAuthUrl({
      scope: ['openid', 'profile', 'email'],
      redirect_uri: this.options.redirectUrl,
      state: this.options.state
    })
  }

  public async getToken(code: string): Promise<Credentials> {
    const oauth2Client = this.getOauth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
  }

  public async getUserInfo(tokens: Credentials): Promise<UserInfo> {
    const oauth2Client = this.getOauth2Client()
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    })
    const result = await oauth2.userinfo.get()

    if (helper.isEmpty(result.data)) {
      throw new ServiceUnavailableException()
    }

    const userInfo = result.data as any

    return {
      openId: userInfo.id,
      user: {
        email: userInfo.email.toLowerCase(),
        lang: formatLocale(userInfo.locale),
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        avatar: userInfo.picture
      }
    }
  }

  private getOauth2Client() {
    return new google.auth.OAuth2(
      this.options.clientId,
      this.options.clientSecret,
      this.options.redirectUrl
    )
  }
}
