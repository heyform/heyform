/**
 * @program: heyform-integration
 * @description: Dropbox
 * @author: mufeng
 * @date: 11/1/21 2:57 PM
 **/

import { helper } from '@heyform-inc/utils'
const isValid = helper.isValid
import { DropboxAuth, Dropbox as Dropbox_V2 } from 'dropbox'
import got from 'got'
import { mapToObject } from './utils'
import {
  Integration,
  IntegrationConfig,
  IntegrationTokens,
  IntegrationUser
} from './integration'
import { timestamp } from '@heyform-inc/utils'

export interface DropboxTokens extends IntegrationTokens {
  uid: string
  accountId: string
}

export interface DropboxConfig extends IntegrationConfig {
  tokens?: DropboxTokens
}

export class Dropbox extends Integration {
  oAuth2Client!: DropboxAuth
  tokens!: DropboxTokens

  constructor(config: DropboxConfig) {
    super(config)
    this.oAuth2Client = new DropboxAuth({
      clientId: this.clientId,
      clientSecret: this.clientSecret
    })
  }

  static init(config: DropboxConfig): Dropbox {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new Dropbox(config)

    if (isValid(config.tokens) && isValid(config.tokens!.accessToken)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  async getToken(code: string): Promise<DropboxTokens> {
    const { result }: any = await this.oAuth2Client.getAccessTokenFromCode(
      this.redirectUri!,
      code
    )

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      scope: Integration.parseScope(result.scope),
      tokenType: result.token_type,
      expiryDate: timestamp() + result.expires_in,
      uid: result.uid,
      accountId: result.account_id
    }
  }

  async refreshAccessToken(): Promise<any> {
    await this.oAuth2Client.refreshAccessToken()

    return {
      ...this.tokens,
      accessToken: this.oAuth2Client.getAccessToken(),
      refreshToken: this.oAuth2Client.getRefreshToken()
    }
  }

  public async userInfo(): Promise<IntegrationUser> {
    const dropbox = new Dropbox_V2({
      accessToken: this.tokens.accessToken
    })
    const { result } = await dropbox.usersGetCurrentAccount()

    return {
      openId: result.account_id,
      user: {
        email: result.email,
        name: result.name.display_name,
        avatar: result.profile_photo_url
      }
    }
  }

  public async folders(): Promise<{ id: any; name: any }[]> {
    const dropbox = new Dropbox_V2({
      accessToken: this.tokens.accessToken
    })
    const { result } = await dropbox.filesListFolder({
      path: '',
      limit: 100
    })

    return result.entries
      .filter(row => row['.tag'] === 'folder')
      .map((row: any) => ({
        id: row.id,
        name: row.name
      }))
  }

  public async upload(pathId: string, fileUrl: string, fileName: string) {
    const dropbox = new Dropbox_V2({
      accessToken: this.tokens.accessToken
    })
    return dropbox.filesUpload({
      path: [pathId, fileName.replace(/\//g, '-')].join('/'),
      contents: await got.get(fileUrl).buffer()
    })
  }

  setCredentials(tokens: DropboxTokens) {
    this.tokens = tokens
  }

  async generateAuthUrl(scope?: string[], state?: string) {
    return await this.oAuth2Client.getAuthenticationUrl(
      this.redirectUri!,
      state,
      'code',
      'offline',
      scope
    )
  }
}
