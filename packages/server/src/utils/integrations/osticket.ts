/**
 * @program: heyform-integrations
 * @description: osTicket
 * @author: Mufeng
 * @date: 2022-07-15 13:28
 **/

import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import { Integration, IntegrationConfig } from './integration'

export interface OsticketConfig extends IntegrationConfig {
  server: string
}

export interface OsticketCreateTicketOptions {
  name: string
  email: string
  subject: string
  message: string
  ip: string
  phone?: string
}

export class Osticket extends Integration {
  server!: string

  static init(config: OsticketConfig): Osticket {
    const osticket = new Osticket(config)
    osticket.server = config.server
    return osticket
  }

  async createTicket(options: OsticketCreateTicketOptions) {
    return this.request('/api/tickets.json', {
      method: 'POST',
      json: {
        alert: true,
        autorespond: true,
        source: 'API',
        ...options,
        message: `data:text/html,${options.message}`
      }
    })
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    return got(url.replace(/^\//, ''), {
      ...options,
      method: options?.method || 'GET',
      prefixUrl: this.server,
      headers: {
        ...options?.headers,
        'X-API-Key': this.clientSecret
      },
      json: options?.json,
      timeout: 30_000
    }).text()
  }
}
