import { Controller, Get } from '@nestjs/common'
import got from 'got'
import { CHANGELOG_API_KEY, CHANGELOG_API_URL } from '@environments'
import { pickObject } from '@heyform-inc/utils'
import { Auth } from '@decorator'

@Controller()
@Auth()
export class ChangelogController {
  @Get('/api/changelog/latest')
  async latest() {
    if (!CHANGELOG_API_URL) {
      return { id: 'unavailable', title: 'No changelog available' }
    }

    const { posts } = await got
      .get(CHANGELOG_API_URL, {
        searchParams: {
          key: CHANGELOG_API_KEY,
          limit: 1
        }
      })
      .json<any>()

    return posts && posts.length > 0
      ? pickObject(posts[0], ['id', 'title'])
      : { id: 'unavailable', title: 'No changelog available' }
  }

  @Get('/api/changelogs')
  async changelogs() {
    if (!CHANGELOG_API_URL) {
      return []
    }

    const { posts } = await got
      .get(CHANGELOG_API_URL, {
        searchParams: {
          key: CHANGELOG_API_KEY
        }
      })
      .json<any>()

    return posts && posts.length > 0
      ? posts.map(p =>
          pickObject(p, [
            'id',
            'title',
            'html',
            ['published_at', 'publishedAt']
          ])
        )
      : []
  }
}
