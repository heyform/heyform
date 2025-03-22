import { helper } from '@heyform-inc/utils'
import { ServiceUnavailableException } from '@nestjs/common'
import { formatLocale } from '../utils/locale'
import { UserInfo } from './apple'
import { generateUrl, request } from './utils'

export interface WechatSocialLoginOptions {
  clientId: string
  clientSecret: string
  redirectUrl: string
  state?: string
}

const authUrl = 'https://open.weixin.qq.com/connect/qrconnect'
const tokenUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token'
const userInfoUrl = 'https://api.weixin.qq.com/sns/userinfo'

export class WechatSocialLogin {
  private readonly options!: WechatSocialLoginOptions

  constructor(options: WechatSocialLoginOptions) {
    this.options = options
  }

  public getAuthUrl(): string {
    return generateUrl(authUrl, {
      response_type: 'code',
      scope: 'snsapi_login',
      appid: this.options.clientId,
      redirect_uri: encodeURIComponent(this.options.redirectUrl),
      state: this.options.state
    })
  }

  public async getToken(code: string): Promise<any> {
    const url = generateUrl(tokenUrl, {
      code,
      grant_type: 'authorization_code',
      appid: this.options.clientId,
      secret: this.options.clientSecret
    })
    const result = await request({
      method: 'GET',
      url
    })

    if (helper.isValid(result?.data.errcode)) {
      throw new ServiceUnavailableException(result?.data.errmsg)
    }

    return result.data
  }

  public async getUserInfo(
    accessToken: string,
    openid: string
  ): Promise<UserInfo> {
    const url = generateUrl(userInfoUrl, {
      access_token: accessToken,
      openid
    })
    const result = await request({
      method: 'GET',
      url
    })

    if (helper.isValid(result?.data.errcode)) {
      throw new ServiceUnavailableException(result?.data.errmsg)
    }

    const userInfo = result.data as any

    return {
      openId: userInfo.unionid,
      user: {
        firstName: userInfo.nickname,
        avatar: userInfo.headimgurl,
        lang: formatLocale('zh-cn')
      }
    }
  }
}
