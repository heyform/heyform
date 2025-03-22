/**
 * @program: heyform-integrations
 * @description: Monday
 * @link: https://monday-api.readme.io/docs
 * @link: https://github.com/mondaycom/monday-sdk-js
 * @author: Mufeng
 * @date: 2021-06-28 10:29
 **/

import { helper, qs } from '@heyform-inc/utils'
const { isEmpty, isValid, isValidArray } = helper
import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import {
  Integration,
  IntegrationConfig,
  IntegrationTokens,
  IntegrationUser
} from './integration'
import { mapToObject } from './utils'

export interface MondayConfig extends IntegrationConfig {
  tokens?: IntegrationTokens
}

const AUTHORIZE_URI = 'https://auth.monday.com/oauth2/authorize'
const OAUTH2_TOKEN_URI = 'https://auth.monday.com/oauth2/token'
const API_BASE_URI = 'https://api.monday.com/v2'

interface GraphqlError {
  message: string
  locations: Array<any>
}

class GraphqlRequestError extends Error {
  // @ts-ignore
  private errors!: GraphqlError[]

  constructor(errors: GraphqlError[]) {
    super()
    this.message = errors[0].message
    this.errors = errors
  }
}

export class Monday extends Integration {
  constructor(config: MondayConfig) {
    super(config)
  }

  static init(config: MondayConfig): Monday {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new Monday(config)

    if (isValid(config.tokens) && isValid(config.tokens!.accessToken)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  public async boards(
    page = 1,
    limit = 100
  ): Promise<
    Array<{
      id: number
      name: string
      state: string
    }>
  > {
    const result = await this.graphql(API_BASE_URI, {
      method: 'POST',
      json: {
        query: `
query {
  boards (page: ${page}, limit: ${limit}) {
    id
    name
    state
  }
}`
      }
    })
    return result.boards
  }

  public async groups(boardId: number): Promise<
    Array<{
      id: string
      title: string
    }>
  > {
    const result = await this.graphql(API_BASE_URI, {
      method: 'POST',
      json: {
        query: `
query {
  boards (ids: ${boardId}) {
    groups {
      id
      title
    }
  }
}`
      }
    })
    return result.boards[0].groups
  }

  public async columns(boardId: number): Promise<
    Array<{
      id: string
      title: string
    }>
  > {
    const result = await this.graphql(API_BASE_URI, {
      method: 'POST',
      json: {
        query: `
query {
  boards (ids: ${boardId}) {
    columns {
      id
      title
      type
    }
  }
}`
      }
    })
    return result.boards[0].columns
  }

  public async createItem(
    boardId: number,
    groupId: string,
    itemName: string,
    columns: Record<string, any> = {}
  ): Promise<number> {
    // see https://monday-api.readme.io/docs/text
    const columnValues = JSON.stringify(columns).replace(/"/g, '\\"')
    const result = await this.graphql(API_BASE_URI, {
      method: 'POST',
      json: {
        query: `
mutation {
  create_item (board_id: ${boardId}, group_id: "${groupId}", item_name: "${itemName}", column_values: "${columnValues}") {
    id
  }
}`
      }
    })
    return Number(result.create_item.id)
  }

  public async userInfo(): Promise<IntegrationUser> {
    const result = await this.graphql(API_BASE_URI, {
      method: 'POST',
      json: {
        query: `
query {
  me {
    id
    name
    email
    photo_original
    created_at
  }
}`
      }
    })

    if (isEmpty(result)) {
      throw new Error('Unable to obtain user information')
    }

    return {
      openId: result.me.id!,
      user: {
        email: result.me.email!.toLowerCase(),
        name: result.me.name,
        avatar: result.me.photo_original
      }
    }
  }

  async getToken(code: string): Promise<IntegrationTokens> {
    const result = await this.request(OAUTH2_TOKEN_URI, {
      method: 'POST',
      form: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code
      }
    })

    return {
      accessToken: result.access_token,
      expiryDate: 0,
      tokenType: result.token_type,
      scope: Integration.parseScope(result.scope)
    }
  }

  setCredentials(tokens: IntegrationTokens) {
    this.tokens = tokens
  }

  generateAuthUrl() {
    const query = qs.stringify(
      {
        client_id: this.clientId,
        redirect_uri: this.redirectUri
      },
      {
        encode: true
      }
    )
    return [AUTHORIZE_URI, query].join('?')
  }

  async graphql(
    url: string,
    options?: OptionsOfTextResponseBody
  ): Promise<any> {
    const result = await this.request(url, options)

    if (isValidArray(result.errors)) {
      throw new GraphqlRequestError(result.errors)
    }

    return result.data
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    return got(url, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        ...options?.headers,
        Authorization: this.tokens?.accessToken
      },
      timeout: 30_000
    }).json()
  }
}
