/**
 * @program: heyform-integrations
 * @description: Airtable
 * @author: Mufeng
 * @date: 2021-06-10 10:29
 **/

import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import { Integration, IntegrationConfig } from './integration'

const API_BASE_URI = 'https://api.airtable.com/v0'

export interface AirtableRecord {
  fields: Record<string, any>
}

export interface AirtableRecordOptions {
  fields?: string[]
  filterByFormula?: string
  maxRecords?: number
  pageSize?: number
  sort?: any[]
  view?: string
  cellFormat?: string
  timeZone?: string
  userLocale?: string
}

export class Airtable extends Integration {
  static init(config: IntegrationConfig): Airtable {
    return new Airtable(config)
  }

  // async fields(baseId: string, table: string): Promise<string[]> {
  //   let fields: string[] = []
  //   const records = await this.records(baseId, table, {
  //     maxRecords: 1
  //   })
  //
  //   if (records.length > 0) {
  //     fields = Object.keys(records[0].fields)
  //   }
  //
  //   return fields
  // }

  async records(
    baseId: string,
    table: string,
    options?: AirtableRecordOptions
  ): Promise<AirtableRecord[]> {
    const url = [API_BASE_URI, baseId, encodeURIComponent(table)].join('/')
    const result = await this.request(url, {
      searchParams: options as any
    })
    return result.records
  }

  async createRecord(
    baseId: string,
    table: string,
    fields: Record<string, any>
  ) {
    const url = [API_BASE_URI, baseId, encodeURIComponent(table)].join('/')
    return this.request(url, {
      method: 'POST',
      json: {
        fields,
        typecast: true
      }
    })
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    return got(url, {
      ...options,
      method: options?.method || 'GET',
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${this.clientSecret}`
      },
      timeout: 30_000
    }).json()
  }
}
