/**
 * @program: heyform-integrations
 * @description: Mailchimp
 * @Link: Dashboard https://admin.mailchimp.com/account/oauth2/
 * @Link: API Documents https://mailchimp.com/developer/marketing/api
 * @author: Mufeng
 * @date: 2021-06-08 13:11
 **/

import { helper, pickObject, qs } from '@heyform-inc/utils'
const isValid = helper.isValid

import * as assert from 'assert'
import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import {
  Integration,
  IntegrationConfig,
  IntegrationTokens
} from './integration'
import { isEmailAddress, mapToObject, md5 } from './utils'

export interface MailchimpTokens extends IntegrationTokens {
  server?: string
}

export interface MailchimpMetadata {
  dc: string
  role: string
  accountname: string
  user_id: number
  login: {
    email: string
    avatar: string
    login_id: number
    login_name: string
    login_email: string
  }
  login_url: string
  api_endpoint: string
}

export interface MailchimpAudience {
  id: string
  name: string
}

export interface MailchimpGroup {
  id: string
  title: string
  display_order: number
  type: 'checkboxes' | 'dropdown' | 'radio' | 'hidden'
  allowMultiple: boolean
}

export interface MailchimpGroupOption {
  id: string
  name: string
  subscriber_count: string
  display_order: number
}

export interface MailchimpTag {
  id: number
  name: string
  member_count: number
  type: string
  created_at: string
  updated_at: string
}

export interface MailchimpContact {
  full_name?: string
  email_address?: string
  status?: string
  interests?: Record<string, boolean>
  language?: string
  tags?: string[]
  merge_fields?: {
    FNAME?: string
    LNAME?: string
    ADDRESS?: {
      addr1: string
      addr2?: string
      city: string
      state: string
      zip: string
      country: string
    }
    PHONE?: string
    BIRTHDAY?: string
  }
}

export interface MailchimpConfig extends IntegrationConfig {
  tokens?: MailchimpTokens
}

const API_BASE_URI = 'https://{server}.api.mailchimp.com/3.0'
const OAUTH2_BASE_URI = 'https://login.mailchimp.com/oauth2'
const AUTHORIZE_URI = `${OAUTH2_BASE_URI}/authorize`
const OAUTH2_TOKEN_URI = `${OAUTH2_BASE_URI}/token`
const OAUTH2_METADATA_URI = `${OAUTH2_BASE_URI}/metadata`

export class Mailchimp extends Integration {
  tokens!: MailchimpTokens

  static init(config: MailchimpConfig): Mailchimp {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new Mailchimp(config)

    if (isValid(config.tokens) && isValid(config.tokens!.accessToken)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  async audiences(): Promise<MailchimpAudience[]> {
    const result = await this.request(`${API_BASE_URI}/lists`)
    return result.lists
  }

  async groups(audienceId: string): Promise<MailchimpGroup[]> {
    const result = await this.request(
      `${API_BASE_URI}/lists/${audienceId}/interest-categories`
    )
    return result.categories
  }

  async groupOptions(
    audienceId: string,
    groupId: string
  ): Promise<MailchimpGroupOption[]> {
    const result = await this.request(
      `${API_BASE_URI}/lists/${audienceId}/interest-categories/${groupId}/interests`
    )
    return result.interests
  }

  async tags(audienceId: string): Promise<MailchimpTag[]> {
    const result = await this.request(
      `${API_BASE_URI}/lists/${audienceId}/segments`
    )
    return result.segments
  }

  async createOrUpdateContact(audienceId: string, contact: MailchimpContact) {
    try {
      return await this.createContact(audienceId, contact)
    } catch (_) {
      return await this.updateContact(audienceId, contact)
    }
  }

  async createContact(audienceId: string, contact: MailchimpContact) {
    assert(
      isEmailAddress(contact.email_address!),
      "Mailchimp email address can't be empty"
    )

    return this.request(`${API_BASE_URI}/lists/${audienceId}/members`, {
      method: 'POST',
      json: contact
    })
  }

  async updateContact(audienceId: string, contact: MailchimpContact) {
    assert(
      isEmailAddress(contact.email_address!),
      "Mailchimp email address can't be empty"
    )

    const contactId = md5(contact.email_address!)
    return this.request(
      `${API_BASE_URI}/lists/${audienceId}/members/${contactId}`,
      {
        method: 'PATCH',
        json: pickObject(contact, [], ['email_address'])
      }
    )
  }

  async getMetadata(): Promise<MailchimpMetadata> {
    return this.request(OAUTH2_METADATA_URI)
  }

  async getToken(code: string): Promise<MailchimpTokens> {
    const result = await this.request(OAUTH2_TOKEN_URI, {
      method: 'POST',
      form: {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code
      }
    })

    return {
      accessToken: result.access_token,
      expiryDate: 0,
      tokenType: 'OAuth',
      scope: result.scope
    }
  }

  setCredentials(tokens: MailchimpTokens) {
    this.tokens = tokens
  }

  generateAuthUrl() {
    const query = qs.stringify(
      {
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri
      },
      {
        encode: true
      }
    )
    return [AUTHORIZE_URI, query].join('?')
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    url = url.replace('{server}', this.tokens?.server!)

    return got(url, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        ...options?.headers,
        Authorization: `${this.tokens?.tokenType} ${this.tokens?.accessToken}`
      },
      timeout: 30_000
    }).json()
  }
}
