import { Buffer } from 'buffer'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'

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
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(),
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

  async restPostJson<T = any>(path: string, payload: any): Promise<RestResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.buildHeaders({ 'content-type': 'application/json' }),
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
   * Uses a one-off HTTP(S) request instead of fetch/undici. The e2e suite
   * makes hundreds of prior requests to the same origin, and undici may still
   * place this multipart POST onto an existing pooled socket before honouring
   * `Connection: close`. When multer then rejects the upload early, CI can end
   * up hanging until the helper's abort timeout fires. A fresh socket per
   * upload keeps this probe deterministic.
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
    const url = new URL(`${this.baseUrl}${path}`)
    const request = url.protocol === 'https:' ? httpsRequest : httpRequest

    return await new Promise<RestResponse>((resolve, reject) => {
      const req = request(
        url,
        {
          method: 'POST',
          agent: false,
          headers: this.buildHeaders({
            'content-type': `multipart/form-data; boundary=${boundary}`,
            'content-length': String(body.length),
            connection: 'close'
          })
        },
        res => {
          const chunks: Buffer[] = []
          res.on('data', chunk => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          })
          res.on('end', () => {
            const headers = new Headers()
            for (const [name, value] of Object.entries(res.headers)) {
              if (Array.isArray(value)) {
                for (const item of value) {
                  headers.append(name, item)
                }
              } else if (value !== undefined) {
                headers.set(name, String(value))
              }
            }

            this.jar.ingestSetCookie(headers)

            const text = Buffer.concat(chunks).toString('utf8')
            let parsed: any = text
            try {
              parsed = text ? JSON.parse(text) : null
            } catch {
              /* keep raw */
            }

            resolve({
              status: res.statusCode ?? 0,
              headers,
              body: parsed,
              text
            })
          })
        }
      )

      req.on('error', reject)
      req.setTimeout(15_000, () => {
        req.destroy(new Error('Upload request timed out after 15000ms'))
      })
      req.end(body)
    })
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
