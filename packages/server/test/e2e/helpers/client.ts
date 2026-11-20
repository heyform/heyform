import { Buffer } from 'buffer'

import { deviceId as makeDeviceId } from './random'

export interface GraphqlError {
  message: string
  extensions?: Record<string, any>
  path?: (string | number)[]
}

export interface GraphqlResponse<T = any> {
  status: number
  data: T | null
  errors: GraphqlError[]
  raw: any
  headers: Headers
}

export interface RestResponse<T = any> {
  status: number
  headers: Headers
  body: T
  text: string
}

export interface E2EClientOptions {
  baseUrl: string
  deviceId?: string
}

/**
 * Minimal cookie jar — strips attributes, keeps name=value pairs.
 * Sufficient for HEYFORM_SESSION / HEYFORM_LOGGED_IN / HEYFORM_DEVICE_ID.
 */
class CookieJar {
  private store = new Map<string, string>()

  ingestSetCookie(headers: Headers): void {
    // getSetCookie() preserves individual Set-Cookie entries (Node 20+ Fetch)
    const list =
      typeof (headers as any).getSetCookie === 'function'
        ? (headers as any).getSetCookie()
        : headers.get('set-cookie')
          ? [headers.get('set-cookie') as string]
          : []
    for (const cookie of list) {
      const [pair] = cookie.split(';')
      const eq = pair.indexOf('=')
      if (eq <= 0) continue
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim()
      if (value === '' || value === 'deleted') {
        this.store.delete(name)
      } else {
        this.store.set(name, value)
      }
    }
  }

  header(): string {
    if (this.store.size === 0) return ''
    return Array.from(this.store.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
  }

  get(name: string): string | undefined {
    return this.store.get(name)
  }

  clear(): void {
    this.store.clear()
  }
}

export class E2EClient {
  readonly baseUrl: string
  readonly deviceId: string
  readonly jar = new CookieJar()

  constructor(opts: E2EClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '')
    this.deviceId = opts.deviceId ?? makeDeviceId()
  }

  private buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Device-Id': this.deviceId,
      'x-anonymous-id': this.deviceId,
      ...extra
    }
    const cookie = this.jar.header()
    if (cookie) headers['cookie'] = cookie
    return headers
  }

  async restGet<T = any>(path: string): Promise<RestResponse<T>> {
    return this.restJson<T>('GET', path)
  }

  async restPostJson<T = any>(path: string, payload: any): Promise<RestResponse<T>> {
    return this.restJson<T>('POST', path, payload)
  }

  accountKeys<T = any>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path = '', payload?: unknown) {
    return this.restJson<T>(method, '/api/v1/account/api-keys' + path, payload, {
      origin: this.baseUrl,
      'sec-fetch-site': 'same-origin'
    })
  }

  async restJson<T = any>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    payload?: unknown,
    headers: Record<string, string> = {}
  ): Promise<RestResponse<T>> {
    if (payload !== undefined) headers = { 'content-type': 'application/json', ...headers }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.buildHeaders(headers),
      body: JSON.stringify(payload),
      redirect: 'manual'
    })
    this.jar.ingestSetCookie(res.headers)
    const text = await res.text()
    let body: any = text
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      /* keep raw text */
    }
    return { status: res.status, headers: res.headers, body, text }
  }

  /**
   * Upload a single file via multipart/form-data to a REST endpoint.
   * Mirrors what the upload controller expects via `multer.single('file')`.
   *
   * Forces `Connection: close` so failed multipart uploads don't leave a
   * keep-alive socket in a surprising state for the next fetch.
   */
  async uploadFile(
    path: string,
    file: { filename: string; contentType: string; data: Buffer | string }
  ): Promise<RestResponse> {
    const boundary = `----heyform-e2e-${Date.now().toString(36)}`
    const fileBuffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data)
    const parts: Buffer[] = [
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${file.filename}"\r\n` +
          `Content-Type: ${file.contentType}\r\n\r\n`
      ),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]
    const body = Buffer.concat(parts)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.buildHeaders({
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': String(body.length),
          connection: 'close'
        }),
        body,
        redirect: 'manual',
        signal: controller.signal
      })
    } finally {
      clearTimeout(timer)
    }
    this.jar.ingestSetCookie(res.headers)
    const text = await res.text()
    let parsed: any = text
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      /* keep raw */
    }
    return { status: res.status, headers: res.headers, body: parsed, text }
  }

  async gql<T = any>(
    operationName: string,
    query: string,
    variables: Record<string, any> = {}
  ): Promise<GraphqlResponse<T>> {
    const res = await fetch(`${this.baseUrl}/graphql`, {
      method: 'POST',
      headers: this.buildHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ operationName, query, variables })
    })
    this.jar.ingestSetCookie(res.headers)
    const text = await res.text()
    let payload: any = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch (err) {
      throw new Error(`Failed to parse GraphQL response (${res.status}): ${text.slice(0, 200)}`)
    }
    const errors = (payload?.errors as GraphqlError[]) ?? []
    const data = payload?.data ? (payload.data[operationName] ?? payload.data) : null
    return {
      status: res.status,
      data,
      errors,
      raw: payload,
      headers: res.headers
    }
  }

  /**
   * Returns data on success; throws with the first GraphQL error otherwise.
   */
  async gqlOk<T = any>(
    operationName: string,
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    const result = await this.gql<T>(operationName, query, variables)
    if (result.errors.length > 0 || result.status >= 400) {
      const msg = result.errors[0]?.message || `HTTP ${result.status}`
      const code = result.errors[0]?.extensions?.code
      const details = JSON.stringify({ errors: result.errors, status: result.status })
      throw new Error(
        `GraphQL ${operationName} failed: ${msg}${code ? ` [${code}]` : ''} — ${details}`
      )
    }
    return result.data as T
  }

  isAuthenticated(): boolean {
    return Boolean(this.jar.get('HEYFORM_SESSION'))
  }
}
