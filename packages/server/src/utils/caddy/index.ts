import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'

import { Logger } from '../logger'

export interface CaddyOptions {
  apiUrl: string
  serverId: string
  tlsAutomationPolicyId: string
}

export class Caddy {
  private readonly logger: Logger
  private readonly apiUrl: string
  private readonly serverUrl: string
  private readonly tlsPolicySubjectUrl: string

  constructor(options: CaddyOptions) {
    this.logger = new Logger(Caddy.name)
    this.apiUrl = options.apiUrl
    this.serverUrl = `/id/${options.serverId}/routes`
    this.tlsPolicySubjectUrl = `/id/${options.tlsAutomationPolicyId}/subjects`
  }

  public async findRoute(host: string) {
    try {
      return await this.request(`/id/${host}`)
    } catch (err) {
      this.logger.warn(err.response?.body || err)
    }
  }

  public async findAndDeleteRoute(host: string) {
    const [route, subjects] = await Promise.all([
      this.findRoute(host),
      this.findTlsPolicySubjects()
    ])

    if (route) {
      await this.deleteRoute(host)
    }

    const hostIndex = subjects.indexOf(host)

    if (hostIndex > -1) {
      subjects.splice(hostIndex, 1)
      await this.updateTlsPolicySubject(subjects)
    }
  }

  public async createOrUpdateRoute(
    teamId: string,
    host: string,
    upstream: string,
    oldHost?: string
  ) {
    const [route, subjects] = await Promise.all([
      this.findRoute(host),
      this.findTlsPolicySubjects()
    ])

    if (!route) {
      await this.createRoute(teamId, host, upstream)
    } else {
      await this.updateRoute(teamId, host, upstream)
    }

    if (oldHost) {
      const oldHostIndex = subjects.findIndex(s => s === oldHost)

      if (oldHostIndex > -1) {
        subjects.splice(oldHostIndex, 1)
      }

      await this.findAndDeleteRoute(oldHost)
    }

    if (!subjects.includes(host)) {
      subjects.push(host)
    }

    await this.updateTlsPolicySubject(subjects)
  }

  public async createRoute(teamId: string, host: string, upstream: string) {
    return this.request(this.serverUrl, {
      method: 'POST',
      json: this.getRouteObject(teamId, host, upstream)
    })
  }

  public async updateRoute(teamId: string, host: string, upstream: string) {
    return this.request(`/id/${host}`, {
      method: 'PATCH',
      json: this.getRouteObject(teamId, host, upstream)
    })
  }

  public async deleteRoute(host: string) {
    return this.request(`/id/${host}`, {
      method: 'DELETE'
    })
  }

  public async findTlsPolicySubjects(): Promise<string[]> {
    return this.request(this.tlsPolicySubjectUrl)
  }

  public async updateTlsPolicySubject(subjects: string[]) {
    return this.request(this.tlsPolicySubjectUrl, {
      method: 'PATCH',
      json: subjects
    })
  }

  private getRouteObject(teamId: string, host: string, upstream: string) {
    return {
      '@id': host,
      handle: [
        {
          handler: 'subroute',
          routes: [
            {
              group: 'group0',
              handle: [
                {
                  handler: 'rewrite',
                  uri: `/f/${teamId}{http.request.uri}`
                }
              ],
              match: [
                {
                  not: [
                    {
                      path: ['/f/_next/*', '/f/static/*']
                    }
                  ]
                }
              ]
            },
            {
              handle: [
                {
                  handler: 'reverse_proxy',
                  headers: {
                    request: {
                      set: {
                        Host: ['{http.reverse_proxy.upstream.hostport}'],
                        'X-Forwarded-Host': ['{http.request.host}']
                      }
                    }
                  },
                  transport: {
                    protocol: 'http',
                    tls: {}
                  },
                  upstreams: [
                    {
                      dial: `${upstream}:443`
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      match: [
        {
          host: [host]
        }
      ],
      terminal: true
    }
  }

  private async request(
    url: string,
    options?: OptionsOfTextResponseBody
  ): Promise<any> {
    return got(url.replace(/^\/+/, ''), {
      ...options,
      prefixUrl: this.apiUrl,
      timeout: 30_000
    }).json()
  }
}
