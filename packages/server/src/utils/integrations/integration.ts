/**
 * @program: heyform-integrations
 * @description: 基础类
 * @author: Mufeng
 * @date: 2021-06-08 13:11
 **/

export interface IntegrationConfig {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
}

export interface IntegrationTokens {
  accessToken: string
  refreshToken?: string | null
  scope?: string
  tokenType?: string | null
  expiryDate?: number | null // 0 表示永不过期
}

export interface IntegrationUser {
  openId: string
  user: {
    login?: string | null
    email?: string | null
    name?: string | null
    avatar?: string | null
  }
}

export class Integration {
  // 配置信息
  clientId?: string
  clientSecret?: string
  redirectUri?: string

  // 授权信息
  tokens!: IntegrationTokens

  constructor(config: IntegrationConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
  }

  static parseScope(scope = '') {
    return scope
      .split(/\s+/g)
      .sort((a, b) => (a > b ? 1 : -1))
      .join(' ')
  }
}
