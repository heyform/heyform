import { helper, qs, timestamp } from '@heyform-inc/utils'
import { aesEncryptObject } from '@heyforms/nestjs'
import got from 'got'
import { ENCRYPTION_KEY } from '@environments'

interface SlackOptions {
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

const SLACK_URL = 'https://slack.com'
const OAUTH2_AUTHORIZE_URL = `${SLACK_URL}/oauth/v2/authorize`
const API_BASE_URL = `${SLACK_URL}/api`
const OAUTH2_TOKEN_URI = `${API_BASE_URL}/oauth.v2.access`

export class Slack {
  private readonly options: SlackOptions
  private tokens?: IntegrationTokens

  constructor(options: SlackOptions) {
    this.options = options
  }

  static init(options: SlackOptions) {
    const slack = new Slack(options)

    if (options.tokens) {
      slack.setCredentials(mapToObject(options.tokens))
    }

    return slack
  }

  async channels() {
    return (await this.request(`${API_BASE_URL}/conversations.list`)).channels
  }

  async postMessage(channelId: string, text: string) {
    return this.request(`${API_BASE_URL}/chat.postMessage`, {
      method: 'POST',
      json: {
        channel: channelId,
        text
      }
    })
  }

  async getToken(code: string) {
    const result = await this.request(OAUTH2_TOKEN_URI, {
      method: 'POST',
      form: {
        grant_type: 'authorization_code',
        redirect_uri: this.options.redirectUri,
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        code
      }
    })

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      scope: result.scope,
      tokenType: 'Bearer',
      expiryDate: timestamp() + result.expires_in,
      userInfo: {
        openId: result.authed_user.id + '.' + result.team.id
      }
    }
  }

  async refreshAccessToken() {
    const result = await this.request(OAUTH2_TOKEN_URI, {
      method: 'POST',
      form: {
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.tokens?.refreshToken
      }
    })

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      scope: result.scope,
      tokenType: 'Bearer',
      expiryDate: timestamp() + result.expires_in
    }
  }

  setCredentials(tokens: IntegrationTokens) {
    this.tokens = tokens
  }

  generateAuthUrl(scope: string, userScope: string, deviceId: string) {
    const state = aesEncryptObject(
      {
        id: deviceId,
        t: timestamp()
      },
      ENCRYPTION_KEY
    )

    const query = {
      state,
      client_id: this.options.clientId,
      redirect_uri: this.options.redirectUri,
      response_type: 'code',
      scope,
      user_scope: userScope
    }

    return OAUTH2_AUTHORIZE_URL + '?' + qs.stringify(query)
  }

  request(url: string, options?: any): Promise<any> {
    return got(url, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        Authorization: [this.tokens?.tokenType, this.tokens?.accessToken]
          .filter(Boolean)
          .join(' '),
        ...options?.headers
      },
      timeout: 30_000
    }).json()
  }
}
