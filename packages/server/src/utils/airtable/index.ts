import { helper, qs, timestamp } from '@heyform-inc/utils'
import { createHash } from 'crypto'
import { aesEncryptObject, base64Encode } from '@heyforms/nestjs'
import got from 'got'
import { ENCRYPTION_KEY } from '@environments'

interface AirtableOptions {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  tokens?: any
}

interface IntegrationTokens {
  accessToken: string
  refreshToken?: string | null
  scope?: string
  tokenType?: string | null
  expiryDate?: number | null
}

function mapToObject<T = any>(mapLike: any): T {
  if (helper.isEmpty(mapLike)) {
    return {} as T
  }

  return helper.isMap(mapLike) ? Object.fromEntries(mapLike) as T : mapLike
}

const AIRTABLE_URL = 'https://www.airtable.com'
const API_BASE_URL =
  process.env.AIRTABLE_API_URL || 'https://api.airtable.com/v0'
const OAUTH2_AUTHORIZE_URL = `${AIRTABLE_URL}/oauth2/v1/authorize`
const OAUTH2_TOKEN_URI = `${AIRTABLE_URL}/oauth2/v1/token`

export class Airtable {
  private readonly options: AirtableOptions
  private tokens?: IntegrationTokens

  constructor(options: AirtableOptions) {
    this.options = options
  }

  static init(options: AirtableOptions) {
    const airtable = new Airtable(options)

    if (options.tokens) {
      airtable.setCredentials(mapToObject(options.tokens))
    }

    return airtable
  }

  async bases() {
    return (await this.request(`${API_BASE_URL}/meta/bases`)).bases
  }

  async tables(baseId: string) {
    return (await this.request(`${API_BASE_URL}/meta/bases/${baseId}/tables`))
      .tables
  }

  async createRecord(
    baseId: string,
    tableId: string,
    fields: Record<string, any>
  ) {
    return this.request(`${API_BASE_URL}/${baseId}/${tableId}`, {
      method: 'POST',
      json: {
        fields
      }
    })
  }

  async getToken(code: string, deviceId: string) {
    const result = await this.request(OAUTH2_TOKEN_URI, {
      method: 'POST',
      headers: this.getBasicAuthorization(),
      form: {
        grant_type: 'authorization_code',
        code_verifier: this.getCodeVerifier(deviceId),
        redirect_uri: this.options.redirectUri,
        code
      }
    })

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      scope: result.scope,
      tokenType: result.token_type,
      expiryDate: timestamp() + result.expires_in
    }
  }

  async refreshAccessToken() {
    const result = await this.request(OAUTH2_TOKEN_URI, {
      method: 'POST',
      headers: this.getBasicAuthorization(),
      form: {
        grant_type: 'refresh_token',
        refresh_token: this.tokens?.refreshToken
      }
    })

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      scope: result.scope,
      tokenType: result.token_type,
      expiryDate: timestamp() + result.expires_in
    }
  }

  async userInfo() {
    const result = await this.request(`${API_BASE_URL}/meta/whoami`)

    return {
      openId: result.id,
      email: result.email
    }
  }

  setCredentials(tokens: IntegrationTokens) {
    this.tokens = tokens
  }

  generateAuthUrl(scope: string, deviceId: string) {
    const state = aesEncryptObject(
      {
        id: deviceId,
        t: timestamp()
      },
      ENCRYPTION_KEY
    )

    const codeVerifier = this.getCodeVerifier(deviceId)

    const query = {
      state,
      code_challenge: this.sha256(codeVerifier),
      code_challenge_method: 'S256',
      client_id: this.options.clientId,
      redirect_uri: this.options.redirectUri,
      response_type: 'code',
      scope
    }

    return OAUTH2_AUTHORIZE_URL + '?' + qs.stringify(query)
  }

  request(url: string, options?: any): Promise<any> {
    return got(url, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        ...this.getBearerAuthorization(),
        ...options?.headers
      },
      timeout: 30_000
    }).json()
  }

  getCodeVerifier(deviceId: string) {
    return this.sha256(deviceId)
  }

  sha256(str: string) {
    return createHash('sha256')
      .update(str)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  getBasicAuthorization() {
    return {
      Authorization:
        'Basic ' +
        base64Encode(`${this.options.clientId}:${this.options.clientSecret}`)
    }
  }

  getBearerAuthorization() {
    if (this.tokens?.accessToken) {
      return {
        Authorization: `${this.tokens?.tokenType} ${this.tokens.accessToken}`
      }
    }
  }
}
