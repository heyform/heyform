import { ServiceUnavailableException } from '@nestjs/common'
import { formatLocale } from '../utils/locale'
import { UserInfo } from './apple'
import { generateUrl } from './utils'
import AlipaySdk from 'alipay-sdk'

export interface AlipaySocialLoginOptions {
  appId: string
  privateKey: string
  alipayPublicKey: string
  redirectUrl: string
  state?: string
}

const authUrl = 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm'

export class AlipaySocialLogin {
  private readonly options!: AlipaySocialLoginOptions
  private readonly alipaySdk!: AlipaySdk

  constructor(options: AlipaySocialLoginOptions) {
    this.options = options
    this.alipaySdk = new AlipaySdk({
      appId: options.appId,
      privateKey: options.privateKey,
      alipayPublicKey: options.alipayPublicKey
    })
  }

  public getAuthUrl(): string {
    return generateUrl(authUrl, {
      app_id: this.options.appId,
      scope: 'auth_user',
      redirect_uri: encodeURIComponent(this.options.redirectUrl),
      state: this.options.state
    })
  }

  public async getToken(code: string): Promise<any> {
    return this.alipaySdk.exec('alipay.system.oauth.token', {
      grantType: 'authorization_code',
      code
    })
  }

  public async getUserInfo(authToken: string): Promise<UserInfo> {
    const result = await this.alipaySdk.exec('alipay.user.info.share', {
      appId: this.options.appId,
      authToken
    })

    if (result.code !== '10000') {
      throw new ServiceUnavailableException(result.msg)
    }

    return {
      openId: result.userId,
      user: {
        firstName: result.nickName,
        avatar: result.avatar,
        lang: formatLocale('zh-cn')
      }
    }
  }
}
