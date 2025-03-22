/**
 * @program: heyform-integrations
 * @description: SupportPal
 * @author: Mufeng
 * @date: 2021-10-17 13:28
 **/

import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import { Integration, IntegrationConfig } from './integration'
import { base64Encode } from './utils'

interface SupportPalProps extends IntegrationConfig {
  supportPalBaseUri: string
}

interface SupportPalCreateTicket {
  user_firstname: string
  user_lastname: string
  user_email: string
  subject: string
  text: string
  user_ip_address?: string
  department?: number
  status?: number
  priority?: number
}

interface SupportPalItemType {
  id: string
  name: string
}

export class SupportPal extends Integration {
  private readonly supportPalBaseUri!: string

  static init(config: SupportPalProps): SupportPal {
    return new SupportPal(config)
  }

  constructor(config: SupportPalProps) {
    super(config)
    this.supportPalBaseUri = config.supportPalBaseUri
  }

  async departments(limit = 9999): Promise<SupportPalItemType[]> {
    const result = await this.request('api/ticket/department', {
      searchParams: {
        limit
      }
    })
    return result.data.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  async priorities(
    department_id: number | string,
    limit = 9999
  ): Promise<SupportPalItemType[]> {
    const result = await this.request('api/ticket/priority', {
      searchParams: {
        department_id,
        limit
      }
    })
    return result.data.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  async customFields(
    department_id: number | string,
    limit = 9999
  ): Promise<SupportPalItemType[]> {
    const result = await this.request('api/ticket/customfield', {
      searchParams: {
        department_id,
        limit
      }
    })
    return result.data.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  async tags(limit = 9999): Promise<SupportPalItemType[]> {
    const result = await this.request('api/ticket/tag', {
      searchParams: {
        limit
      }
    })
    return result.data.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  async status(limit = 9999): Promise<SupportPalItemType[]> {
    const result = await this.request('api/ticket/status', {
      searchParams: {
        limit
      }
    })
    return result.data.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  async createTicket(ticket: SupportPalCreateTicket): Promise<any> {
    // Replace ticket text newlines with <br>
    ticket.text = ticket.text.replace(/\r\n/g, '<br />')

    const result = await this.request('api/ticket/ticket', {
      method: 'POST',
      form: ticket
    })

    return result.data
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    const token = base64Encode(`${this.clientSecret}:X`)

    return got(url, {
      ...options,
      prefixUrl: this.supportPalBaseUri,
      method: options?.method || 'GET',
      headers: {
        ...options?.headers,
        Authorization: `Basic ${token}`
      },
      searchParams: options?.form,
      form: options?.form,
      timeout: 30_000
    }).json()
  }
}
