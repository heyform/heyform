import got from 'got'
import { OptionsOfTextResponseBody } from 'got/dist/source/types'
import { Integration, IntegrationConfig } from './integration'

export interface GitlabConfig extends IntegrationConfig {
  server: string
}

export interface GitlabCreateIssue {
  title: string
  description?: string
  assignee_ids?: number[]
  milestone_id?: number
  labels?: string[]
}

export interface GitlabResultType {
  id: number
  name: string
}

export class Gitlab extends Integration {
  server!: string

  static init(config: GitlabConfig): Gitlab {
    const instance = new Gitlab(config)
    instance.server = config.server
    return instance
  }

  public async groups(): Promise<GitlabResultType[]> {
    const result = await this.request('/groups?per_page=100')
    return result.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  public async projects(groupId: number | string): Promise<GitlabResultType[]> {
    const result = await this.request(
      `/groups/${groupId}/projects?per_page=100`
    )
    return result.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  public async createIssue(
    projectId: number | string,
    issue: GitlabCreateIssue
  ): Promise<any> {
    return this.request(`/projects/${projectId}/issues`, {
      method: 'POST',
      json: {
        ...issue,
        labels: issue.labels?.join(',')
      }
    })
  }

  public async labels(projectId: number | string): Promise<GitlabResultType[]> {
    const result = await this.request(
      `/projects/${projectId}/labels?per_page=100`
    )
    return result.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  public async members(
    projectId: number | string
  ): Promise<GitlabResultType[]> {
    const result = await this.request(
      `/projects/${projectId}/members/all?per_page=100`
    )
    return result.map((row: any) => ({
      id: row.id,
      name: row.name
    }))
  }

  public async milestones(
    projectId: number | string
  ): Promise<GitlabResultType[]> {
    const result = await this.request(
      `/projects/${projectId}/milestones?per_page=100`
    )
    return result.map((row: any) => ({
      id: row.id,
      name: row.title
    }))
  }

  request(url: string, options?: OptionsOfTextResponseBody): Promise<any> {
    url = this.server.replace(/\/$/, '') + '/api/v4' + url

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
