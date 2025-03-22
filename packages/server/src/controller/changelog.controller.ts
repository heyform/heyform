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
    const { posts } = await got
      .get(CHANGELOG_API_URL, {
        searchParams: {
          key: CHANGELOG_API_KEY,
          limit: 1
        }
      })
      .json<any>()

    return pickObject(posts[0], ['id', 'title'])
  }

  @Get('/api/changelogs')
  async changelogs() {
    const { posts } = await got
      .get(CHANGELOG_API_URL, {
        searchParams: {
          key: CHANGELOG_API_KEY
        }
      })
      .json<any>()

    return posts.map(p =>
      pickObject(p, ['id', 'title', 'html', ['published_at', 'publishedAt']])
    )
  }
}
