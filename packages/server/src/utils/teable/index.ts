import got from 'got'

export interface TeableOptions {
  apiURL: string
  apiKey: string
}

export class Teable {
  private readonly options: TeableOptions

  constructor(options: TeableOptions) {
    this.options = options
  }

  async findRecord(tableId: string, recordId: string) {
    return this.request(`/table/${tableId}/record/${recordId}`)
  }

  async updateRecord(tableId: string, recordId: string, updates: any) {
    return this.request(`/table/${tableId}/record/${recordId}`, {
      method: 'PATCH',
      json: updates
    })
  }

  async records(tableId: string) {
    const { records } = await this.request(`/table/${tableId}/record`, {
      searchParams: {
        take: 1000
      }
    })

    return records
  }

  private request(url: string, options?: any): Promise<any> {
    return got(this.options.apiURL + url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        ...options?.headers
      },
      timeout: 30_000
    }).json()
  }
}
