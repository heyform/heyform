import { Injectable } from '@nestjs/common'
import got from 'got'

interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  html_url: string
  published_at: string
}

const GITHUB_API_URL = 'https://api.github.com/repos/heyform/heyform/releases'
const CACHE_TTL_MS = 5 * 60 * 1000
type LatestRelease = Pick<GitHubRelease, 'id'> & { publishedAt: string }

@Injectable()
export class ChangelogService {
  private latestRelease: LatestRelease | null = null
  private latestExpiresAt = 0
  private pendingLatest?: Promise<LatestRelease | null>

  async getLatestRelease(): Promise<LatestRelease | null> {
    if (Date.now() < this.latestExpiresAt) return this.latestRelease
    if (this.pendingLatest) return this.pendingLatest

    this.pendingLatest = this.fetchLatestRelease()
    try {
      return await this.pendingLatest
    } finally {
      this.pendingLatest = undefined
    }
  }

  private async fetchLatestRelease(): Promise<LatestRelease | null> {
    try {
      const result = await got
        .get(`${GITHUB_API_URL}/latest`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Heyform-Changelog'
          },
          timeout: { request: 5000 },
          retry: { limit: 0 }
        })
        .json<GitHubRelease>()

      this.latestRelease = {
        id: result.id,
        publishedAt: result.published_at
      }
    } catch {
      // The update badge is optional: keep the last release during GitHub outages.
    } finally {
      // Cache failures too, so each workspace visit doesn't retry a rate-limited API.
      this.latestExpiresAt = Date.now() + CACHE_TTL_MS
    }

    return this.latestRelease
  }

  async getAllReleases() {
    const result = await got
      .get(GITHUB_API_URL, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Heyform-Changelog'
        }
      })
      .json<GitHubRelease[]>()

    return result.map(r => ({
      id: r.id,
      title: r.name || r.tag_name,
      content: r.body || '',
      publishedAt: r.published_at
    }))
  }
}
