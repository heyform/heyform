import { mapToObject } from '@heyforms/integrations'
import { qs } from '@heyform-inc/utils'
import got from 'got'

interface NotionOptions {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  tokens?: NotionTokens
}

interface NotionTokens {
  accessToken: string
  scope?: string
  tokenType?: string | null
  expiryDate?: number | null
}

const API_BASE_URI = 'https://api.notion.com/v1'
const OAUTH2_AUTHORIZE_URL = `${API_BASE_URI}/oauth/authorize`

const DISABLED_FIELD_TYPES = ['relation', 'people', 'status', 'rollup']

export class Notion {
  private readonly options: NotionOptions
  private tokens?: NotionTokens

  constructor(options: NotionOptions) {
    this.options = options
  }

  static init(options: NotionOptions) {
    const notion = new Notion(options)

    if (options.tokens) {
      notion.setCredentials(mapToObject(options.tokens))
    }

    return notion
  }

  async databases() {
    const { results } = await this.request('/search', {
      method: 'POST',
      json: {
        filter: {
          value: 'database',
          property: 'object'
        },
        sort: {
          direction: 'ascending',
          timestamp: 'last_edited_time'
        }
      }
    })

    return results.map((row: any) => ({
      id: row.id,
      name: row.title[0]?.plain_text,
      fields: Object.keys(row.properties)
        .map(key => {
          const property = row.properties[key]

          return {
            id: property.id,
            name: property.name,
            type: property.type
          }
        })
        .filter(row => !DISABLED_FIELD_TYPES.includes(row.type))
    }))
  }

  async createRecord(databaseId: string, properties: any) {
    return this.request('/pages', {
      method: 'POST',
      json: {
        parent: {
          database_id: databaseId
        },
        properties
      }
    })
  }

  async getToken(code: string) {
    const result = await this.request('/oauth/token', {
      method: 'POST',
      form: {
        grant_type: 'authorization_code',
        redirect_uri: this.options.redirectUri,
        code
      },
      username: this.options.clientId,
      password: this.options.clientSecret
    })

    return {
      accessToken: result.access_token,
      tokenType: 'Bearer',
      expiryDate: 0,
      userInfo: {
        openId: result.bot_id
      }
    }
  }

  setCredentials(tokens: NotionTokens) {
    this.tokens = tokens
  }

  generateAuthUrl() {
    const query = {
      client_id: this.options.clientId,
      redirect_uri: this.options.redirectUri,
      response_type: 'code',
      owner: 'user'
    }

    return OAUTH2_AUTHORIZE_URL + '?' + qs.stringify(query)
  }

  request(url: string, options?: any): Promise<any> {
    return got(API_BASE_URI + url, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        Authorization: [this.tokens?.tokenType, this.tokens?.accessToken]
          .filter(Boolean)
          .join(' '),
        'Notion-Version': '2022-06-28',
        ...options?.headers
      },
      timeout: 30_000
    }).json()
  }
}
