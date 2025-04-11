import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import got from 'got'

interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  html_url: string
  published_at: string
}

@Injectable()
export class ChangelogService {
  private readonly GITHUB_API_URL =
    'https://api.github.com/repos/heyform/heyform/releases'

  async getLatestRelease() {
    try {
      const response = await got
        .get(`${this.GITHUB_API_URL}/latest`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Heyform-Changelog'
          }
        })
        .json<GitHubRelease>()

      // Log the response for debugging
      console.log('GitHub API Response:', response)

      return {
        version: response.tag_name || 'unknown',
        releaseDate: response.published_at || new Date().toISOString(),
        releaseUrl: response.html_url || '',
        notes: response.body || ''
      }
    } catch (error) {
      // Log the error for debugging
      console.error('GitHub API Error:', error)

      if (error instanceof got.HTTPError) {
        throw new HttpException(
          `GitHub API Error: ${error.response?.statusCode} ${error.response?.statusMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      }
      throw new HttpException(
        'Failed to fetch changelog from GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  async getAllReleases() {
    try {
      const response = await got
        .get(this.GITHUB_API_URL, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Heyform-Changelog'
          }
        })
        .json<GitHubRelease[]>()

      return response.map(release => ({
        id: release.id.toString(),
        title: release.name || release.tag_name,
        html: release.body || '',
        publishedAt: release.published_at
      }))
    } catch (error) {
      console.error('GitHub API Error:', error)
      return [{ id: 'unavailable', title: 'No changelog available' }]
    }
  }
}
