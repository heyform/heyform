import { ServiceUnavailableException } from '@nestjs/common'
import { generators, Issuer } from 'openid-client'

import { formatLocale } from './utils'
import { UserInfo } from './apple'

export interface OidcSocialLoginOptions {
  clientId: string
  clientSecret: string
  issuer: string
  redirectUrl: string
  state?: string
}

/**
 * Generic OIDC social login provider.
 * Uses openid-client (certified OIDC relying party) to support any
 * standards-compliant OpenID Connect provider (Authelia, Keycloak, etc.).
 */
export class OidcSocialLogin {
  private readonly options: OidcSocialLoginOptions

  constructor(options: OidcSocialLoginOptions) {
    this.options = options
  }

  public async getAuthUrl(): Promise<string> {
    const client = await this.getClient()
    return client.authorizationUrl({
      scope: 'openid profile email',
      redirect_uri: this.options.redirectUrl,
      state: this.options.state ?? generators.state()
    })
  }

  public async getToken(code: string, iss?: string): Promise<Record<string, unknown>> {
    const client = await this.getClient()
    const params: Record<string, string> = { code }
    if (iss) params.iss = iss
    const tokenSet = await client.callback(
      this.options.redirectUrl,
      params,
      { state: undefined }
    )
    return tokenSet as unknown as Record<string, unknown>
  }

  public async getUserInfo(tokenSet: Record<string, unknown>): Promise<UserInfo> {
    const client = await this.getClient()
    const userinfo: Record<string, unknown> = await client.userinfo(tokenSet as any)

    if (!userinfo) {
      throw new ServiceUnavailableException('OIDC userinfo endpoint returned empty response')
    }

    const email = (userinfo.email as string | undefined)?.toLowerCase()
    const name =
      (userinfo.name as string | undefined) ||
      (userinfo.preferred_username as string | undefined) ||
      email?.split('@')[0] ||
      'user'

    return {
      openId: userinfo.sub as string,
      user: {
        email,
        name,
        avatar: (userinfo.picture as string | undefined) ?? '',
        lang: formatLocale((userinfo.locale as string | undefined) ?? '')
      }
    }
  }

  private async getClient() {
    const issuer = await Issuer.discover(this.options.issuer)
    return new issuer.Client({
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      redirect_uris: [this.options.redirectUrl],
      response_types: ['code']
    })
  }
}
