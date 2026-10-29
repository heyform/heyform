import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { createPublicKey } from 'crypto'
import * as jwt from 'jsonwebtoken'

import { formatLocale, generateUrl, request } from './utils'
import { qs, timestamp } from '@heyform-inc/utils'

import { gravatar } from '../gravatar'

export interface UserInfo {
  openId: string
  issuer?: string
  subject?: string
  emailVerified?: boolean
  user: {
    email?: string
    name: string
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
const keysUrl = `${baseUrl}/auth/keys`

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

  public async getUserInfo(idToken: string): Promise<UserInfo> {
    const decoded = jwt.decode(idToken, { complete: true }) as jwt.Jwt | null

    if (!decoded?.header?.kid) {
      throw new UnauthorizedException('Invalid Apple ID token')
    }

    let result: any

    try {
      result = jwt.verify(idToken, await this.getPublicKey(decoded.header.kid), {
        algorithms: ['RS256'],
        issuer: baseUrl,
        audience: this.options.webClientId
      })
    } catch {
      throw new UnauthorizedException('Invalid Apple ID token')
    }

    if (!result?.sub || !result.email) {
      throw new ServiceUnavailableException()
    }

    return {
      openId: result.sub,
      emailVerified: result.email_verified === true || result.email_verified === 'true',
      user: {
        email: result.email.toLowerCase(),
        name: result.email.split('@')[0],
        avatar: gravatar(result.email),
        lang: formatLocale()
      }
    }
  }

  private async getPublicKey(kid: string): Promise<string> {
    const result = await request({ url: keysUrl })
    const key = result.data?.keys?.find((k: any) => k.kid === kid)

    if (!key) {
      throw new UnauthorizedException('Invalid Apple ID token')
    }

    return createPublicKey({ key, format: 'jwk' })
      .export({ type: 'spki', format: 'pem' })
      .toString()
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
