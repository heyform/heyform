import { qs, timestamp } from '@heyform-inc/utils'
import { ServiceUnavailableException } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import { gravatar } from '../gravatar'
import { formatLocale } from '../utils/locale'
import { generateUrl, request } from './utils'

export interface UserInfo {
  openId: string
  user: {
    email?: string
    firstName: string
    lastName?: string
    avatar: string
    lang?: string
  }
}

export interface AppleSocialLoginOptions {
  webClientId: string
  teamId: string
  keyId: string
  privateKey: string
  redirectUrl: string
  state?: string
}

const baseUrl = 'https://appleid.apple.com'
const authUrl = `${baseUrl}/auth/authorize`
const tokenUrl = `${baseUrl}/auth/token`

export class AppleSocialLogin {
  private readonly options!: AppleSocialLoginOptions

  constructor(options: AppleSocialLoginOptions) {
    this.options = options
  }

  public getAuthUrl(): string {
    return generateUrl(authUrl, {
      client_id: this.options.webClientId,
      redirect_uri: encodeURIComponent(this.options.redirectUrl),
      response_type: 'code',
      response_mode: 'form_post',
      operation: 'login',
      scope: 'name email',
      state: this.options.state
    })
  }

  public async getToken(code: string): Promise<any> {
    const result = await request({
      url: tokenUrl,
      method: 'POST',
      data: qs.stringify({
        code,
        grant_type: 'authorization_code',
        client_id: this.options.webClientId,
        client_secret: this.generateSecret(),
        redirect_uri: this.options.redirectUrl
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return result.data
  }

  public getUserInfo(idToken: string): UserInfo {
    const result: any = jwt.decode(idToken)

    if (!result) {
      throw new ServiceUnavailableException()
    }

    return {
      openId: result.sub,
      user: {
        email: result.email.toLowerCase(),
        firstName: result.email.split('@')[0],
        avatar: gravatar(result.email),
        lang: formatLocale()
      }
    }
  }

  public generateSecret(): string {
    const now = timestamp()

    const claims = {
      iat: now,
      exp: now + 60 * 60,
      iss: this.options.teamId,
      sub: this.options.webClientId,
      aud: baseUrl
    }

    return jwt.sign(claims, this.options.privateKey, {
      algorithm: 'ES256',
      keyid: this.options.keyId
    })
  }
}
