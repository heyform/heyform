/**
 * @program: heyform-integrations
 * @description: Hubspot
 * @link: https://app.hubspot.com/developer/20296480/application/326007
 * @link: https://developers.hubspot.com/docs/api/overview
 * @link: https://github.com/HubSpot/hubspot-api-nodejs
 * @author: Mufeng
 * @date: 2021-06-28 20:46
 **/

import { helper, timestamp } from '@heyform-inc/utils'
const { isEmpty, isValid } = helper

import { Client } from '@hubspot/api-client'
import { SimplePublicObject } from '@hubspot/api-client/lib/codegen/crm/contacts'
import { PublicOwner } from '@hubspot/api-client/lib/codegen/crm/owners'
import * as assert from 'assert'
import {
  Integration,
  IntegrationConfig,
  IntegrationTokens,
  IntegrationUser
} from './integration'
import { isEmailAddress, mapToObject } from './utils'

export interface HubspotConfig extends IntegrationConfig {
  tokens?: IntegrationTokens
}

export interface HubspotContact {
  firstname: string
  lastname: string
  email: string
  phone?: string
  jobtitle?: string
}

export type HubspotOwner = PublicOwner

export class Hubspot extends Integration {
  private oAuth2Client!: Client

  constructor(config: HubspotConfig) {
    super(config)
    this.oAuth2Client = new Client({
      accessToken: config.tokens?.accessToken
    })
  }

  static init(config: HubspotConfig): Hubspot {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new Hubspot(config)

    if (isValid(config.tokens) && isValid(config.tokens!.accessToken)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  async owners(limit = 100): Promise<HubspotOwner[]> {
    const result = await this.oAuth2Client.crm.owners.ownersApi.getPage(
      undefined,
      undefined,
      limit
    )
    return result.results
  }

  async createContact(contact: HubspotContact): Promise<SimplePublicObject> {
    assert(
      isEmailAddress(contact.email!),
      "Hubspot email address can't be empty"
    )

    return await this.oAuth2Client.crm.contacts.basicApi.create({
      properties: {
        ...contact,
        lifecyclestage: 'subscriber'
      }
    })
  }

  public async userInfo(): Promise<IntegrationUser> {
    const result = await this.oAuth2Client.oauth.accessTokensApi.getAccessToken(
      this.tokens.accessToken
    )

    if (isEmpty(result)) {
      throw new Error('Unable to obtain user information')
    }

    return {
      openId: String(result.hubId),
      user: {
        email: result.user?.toLowerCase()
      }
    }
  }

  async getToken(code: string): Promise<IntegrationTokens> {
    const result = await this.oAuth2Client.oauth.tokensApi.createToken(
      'authorization_code',
      code,
      this.redirectUri,
      this.clientId,
      this.clientSecret
    )
    return Hubspot.credentialsToTokens(result)
  }

  async refreshAccessToken(): Promise<IntegrationTokens> {
    const result = await this.oAuth2Client.oauth.tokensApi.createToken(
      'refresh_token',
      undefined,
      undefined,
      this.clientId,
      this.clientSecret,
      this.tokens.refreshToken!
    )
    return Hubspot.credentialsToTokens(result)
  }

  private static credentialsToTokens(credentials: any): IntegrationTokens {
    return {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiryDate: timestamp() + credentials.expiresIn
    }
  }

  setCredentials(tokens: IntegrationTokens) {
    this.tokens = tokens
    this.oAuth2Client.config.accessToken = tokens.accessToken
  }

  generateAuthUrl(scope: string[] | string) {
    return this.oAuth2Client.oauth.getAuthorizationUrl(
      this.clientId!,
      this.redirectUri!,
      scope as string
    )
  }
}
