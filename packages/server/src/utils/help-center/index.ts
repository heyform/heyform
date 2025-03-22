import got from 'got'

interface ContentsResult {
  categories: ContentCategory[]
  list: ContentList[]
}

interface ContentCategory {
  id: string
  title: string
}

interface ContentList {
  id: string
  categoryId: string
  title: string
  description: string
  content: string
}

export class HelpCenter {
  private readonly apiBaseURL: string

  constructor(apiBaseURL: string) {
    this.apiBaseURL = apiBaseURL
  }

  static init(apiBaseURL: string) {
    return new HelpCenter(apiBaseURL)
  }

  async contents(): Promise<ContentsResult> {
    return this.request(`${this.apiBaseURL}/contents`)
  }

  request(url: string, options?: any): Promise<any> {
    return got(url, {
      ...options,
      method: options?.method || 'GET',
      headers: options?.headers,
      timeout: 30_000
    }).json()
  }
}
