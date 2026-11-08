import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import oidc from 'openid-client'

import { formatLocale } from './utils'

import { UserInfo } from './apple'

export interface OidcSocialLoginOptions {
  clientId: string
  clientSecret: string
  clientAuthMethod?: 'client_secret_basic' | 'client_secret_post'
  issuer: string
  redirectUrl: string
}

export interface OidcAuthorizationRequest {
  url: string
  transaction: {
    codeVerifier: string
    nonce: string
  }
}

export function oidcIdentityKey(issuer: string, subject: string): string {
  return `${issuer}#${encodeURIComponent(subject)}`
}

export class OidcSocialLogin {
  private configurationPromise?: Promise<oidc.Configuration>

  constructor(private readonly options: OidcSocialLoginOptions) {}

  async getAuthRequest(state: string): Promise<OidcAuthorizationRequest> {
    const configuration = await this.getConfiguration()
    const codeVerifier = oidc.randomPKCECodeVerifier()
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
    const nonce = oidc.randomNonce()
    const url = oidc.buildAuthorizationUrl(configuration, {
      redirect_uri: this.options.redirectUrl,
      scope: 'openid profile email',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    return {
      url: url.href,
      transaction: {
        codeVerifier,
        nonce
      }
    }
  }

  async getUserInfo(
    callbackParams: Record<string, unknown>,
    expectedState: string,
    transaction: OidcAuthorizationRequest['transaction']
  ): Promise<UserInfo> {
    const configuration = await this.getConfiguration()
    const callbackUrl = new URL(this.options.redirectUrl)

    for (const [key, value] of Object.entries(callbackParams)) {
      if (typeof value === 'string') {
        callbackUrl.searchParams.append(key, value)
      }
    }

    if (!callbackUrl.searchParams.has('code')) {
      throw new BadRequestException('OIDC authorization response is missing a code')
    }

    const tokens = await oidc.authorizationCodeGrant(configuration, callbackUrl, {
      pkceCodeVerifier: transaction.codeVerifier,
      expectedNonce: transaction.nonce,
      expectedState,
      idTokenExpected: true
    })
    const idTokenClaims = tokens.claims()
    const idClaims = (idTokenClaims || {}) as Record<string, unknown>
    const subject = typeof idClaims.sub === 'string' ? idClaims.sub : undefined

    if (!subject) {
      throw new BadRequestException('OIDC response is missing the subject claim')
    }

    let userInfo: Record<string, unknown> = {}

    if (configuration.serverMetadata().userinfo_endpoint && tokens.access_token) {
      userInfo = (await oidc.fetchUserInfo(configuration, tokens.access_token, subject)) as Record<
        string,
        unknown
      >
    }

    const claims = {
      ...idClaims,
      ...userInfo
    }
    const issuer = configuration.serverMetadata().issuer
    const emailClaims = typeof userInfo.email === 'string' ? userInfo : idClaims
    const email =
      typeof emailClaims?.email === 'string' ? emailClaims.email.trim().toLowerCase() : undefined
    const providerName = this.firstString(claims.name)?.trim()
    const name = this.firstString(
      providerName,
      claims.preferred_username,
      email?.split('@')[0],
      subject
    )

    if (!issuer || !name) {
      throw new ServiceUnavailableException('OIDC provider returned incomplete user information')
    }

    return {
      openId: oidcIdentityKey(issuer, subject),
      issuer,
      subject,
      emailVerified: emailClaims?.email_verified === true,
      providerName,
      user: {
        email,
        name,
        avatar: typeof claims.picture === 'string' ? claims.picture : '',
        lang: formatLocale(typeof claims.locale === 'string' ? claims.locale : undefined)
      }
    }
  }

  private firstString(...values: unknown[]): string | undefined {
    return values.find(value => typeof value === 'string' && value.trim().length > 0) as
      | string
      | undefined
  }

  private getConfiguration(): Promise<oidc.Configuration> {
    if (!this.configurationPromise) {
      const clientAuthMethod = this.options.clientAuthMethod || 'client_secret_basic'
      const clientAuthentication =
        clientAuthMethod === 'client_secret_post'
          ? oidc.ClientSecretPost(this.options.clientSecret)
          : oidc.ClientSecretBasic(this.options.clientSecret)

      this.configurationPromise = oidc
        .discovery(
          new URL(this.options.issuer),
          this.options.clientId,
          {
            client_secret: this.options.clientSecret,
            token_endpoint_auth_method: clientAuthMethod
          },
          clientAuthentication
        )
        .catch(error => {
          this.configurationPromise = undefined
          throw error
        })
    }

    return this.configurationPromise
  }
}
