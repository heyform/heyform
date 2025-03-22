/**
 * @program: heyform-integrations
 * @description: EspoCRM
 * @author: Mufeng
 * @date: 2022-03-16 13:50
 **/

import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import { Integration, IntegrationConfig } from './integration'

export interface EspoCRMConfig extends IntegrationConfig {
  server: string
}

export class EspoCRM extends Integration {
  server!: string

  static init(config: EspoCRMConfig): EspoCRM {
    const espoCRM = new EspoCRM(config)
    espoCRM.server = config.server
    return espoCRM
  }

  async createContact(fullName: string, email: string) {
    await this.request('/Lead', {
      method: 'POST',
      json: {
        lastName: fullName,
        emailAddress: email
      }
    })

    return true
  }

  async request(
    url: string,
    options?: OptionsOfTextResponseBody
  ): Promise<any> {
    try {
      return await got(url.replace(/^\//, ''), {
        ...options,
        method: options?.method || 'GET',
        prefixUrl: this.server,
        headers: {
          ...options?.headers,
          'X-Api-Key': this.clientSecret
        },
        json: options?.json,
        timeout: 30_000
      }).json()
    } catch (err: any) {
      throw new Error(err.response?.headers['x-status-reason'] || err.message)
    }
  }
}
