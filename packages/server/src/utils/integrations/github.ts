import { helper, qs } from '@heyform-inc/utils'
const isValid = helper.isValid
import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import {
  Integration,
  IntegrationConfig,
  IntegrationTokens,
  IntegrationUser
} from './integration'
import { mapToObject } from './utils'

export interface GithubConfig extends IntegrationConfig {
  tokens?: IntegrationTokens
}

const API_BASE_URI = 'https://api.github.com'
const OAUTH2_BASE_URI = 'https://github.com/login/oauth'
const AUTHORIZE_URI = `${OAUTH2_BASE_URI}/authorize`
const OAUTH2_TOKEN_URI = `${OAUTH2_BASE_URI}/access_token`

export interface GithubCreateIssue {
  title: string
  body?: string
  assignees?: string[]
  milestone?: number
  labels?: string[]
}

export interface GithubOrganization {
  login: string
  organization: boolean
}

export interface GithubMilestone {
  title: string
  number: number
}

export class Github extends Integration {
  static init(config: GithubConfig): Github {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new Github(config)

    if (isValid(config.tokens) && isValid(config.tokens!.accessToken)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  public async organizations(): Promise<GithubOrganization[]> {
    const result = await this.request(`${API_BASE_URI}/user/orgs?per_page=100`)
    return result.map((row: any) => ({
      login: row.login,
      organization: true
    }))
  }

  public async repositories(query: GithubOrganization): Promise<string[]> {
    const url = query.organization
      ? `/orgs/${query.login}/repos?per_page=100`
      : `/users/${query.login}/repos?per_page=100`
    const result = await this.request(API_BASE_URI + url)
    return result.map((row: any) => row.full_name)
  }

  public async createIssue(
    repository: string,
    issue: GithubCreateIssue
  ): Promise<any> {
    return this.request(`${API_BASE_URI}/repos/${repository}/issues`, {
      method: 'POST',
      json: issue
    })
  }

  public async assignees(repository: string): Promise<string[]> {
    const result = await this.request(
      `${API_BASE_URI}/repos/${repository}/assignees?per_page=100`
    )
    return result.map((row: any) => row.login)
  }

  public async labels(repository: string): Promise<any[]> {
    const result = await this.request(
      `${API_BASE_URI}/repos/${repository}/labels?per_page=100`
    )
    return result.map((row: any) => row.name)
  }

  public async milestones(repository: string): Promise<GithubMilestone[]> {
    const result = await this.request(
      `${API_BASE_URI}/repos/${repository}/milestones?per_page=100`
    )
    return result.map((row: any) => ({
      title: row.title,
      number: row.number
    }))
  }

  public async userInfo(): Promise<IntegrationUser> {
    const result = await this.request(`${API_BASE_URI}/user`)

    return {
      openId: result.id,
      user: {
        login: result.login,
        email: result.email,
        name: result.name,
        avatar: result.avatar_url
      }
    }
  }

  async getToken(code: string): Promise<IntegrationTokens> {
    const result = await this.request(OAUTH2_TOKEN_URI, {
      method: 'POST',
      json: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      }
    })
    return {
      accessToken: result.access_token,
      scope: Integration.parseScope(result.scope),
      tokenType: 'token',
      expiryDate: 0
    }
  }

  setCredentials(tokens: IntegrationTokens) {
    this.tokens = tokens
  }

  generateAuthUrl() {
    const query = qs.stringify(
      {
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: 'repo,user'
      },
      {
        encode: true
      }
    )
    return [AUTHORIZE_URI, query].join('?')
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    return got(url, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        ...options?.headers,
        Accept: 'application/vnd.github.v3+json',
        Authorization: `${this.tokens?.tokenType} ${this.tokens?.accessToken}`
      },
      json: options?.json,
      timeout: 30_000
    }).json()
  }
}
