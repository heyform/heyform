/**
 * @program: heyform-integrations
 * @description: Sendy
 * @author: Mufeng
 * @date: 2021-06-11 13:28
 **/

import { helper } from '@heyform-inc/utils'
const isTrue = helper.isTrue
import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import { Integration, IntegrationConfig } from './integration'
import { RequestError } from './requesterror'

export interface SendyConfig extends IntegrationConfig {
  server: string
}

export class Sendy extends Integration {
  server!: string

  static init(config: SendyConfig): Sendy {
    const sendy = new Sendy(config)
    sendy.server = config.server
    return sendy
  }

  async subscribe(list: string, email: string) {
    const result = await this.request('/subscribe', {
      method: 'POST',
      form: {
        list,
        email,
        boolean: 'true'
      }
    })

    if (!isTrue(result)) {
      throw new RequestError({
        message: result
      })
    }

    return true
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    return got(url.replace(/^\//, ''), {
      ...options,
      method: options?.method || 'GET',
      prefixUrl: this.server,
      headers: options?.headers,
      form: {
        ...options?.form,
        api_key: this.clientSecret
      },
      timeout: 30_000
    }).text()
  }
}
