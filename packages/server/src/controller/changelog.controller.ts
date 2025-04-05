import { Controller, Get } from '@nestjs/common'
import axios from 'axios'

@Controller()
export class ChangelogController {
  @Get('/api/changelog/latest')
  async latest() {
    try {
      const response = await axios.get(
        'https://api.github.com/repos/heyform/heyform/releases/latest'
      )

      const { id, name, body, published_at } = response.data

      return {
        id: id.toString(),
        title: name,
        html: body,
        publishedAt: published_at
      }
    } catch (error) {
      return { id: 'unavailable', title: 'No changelog available' }
    }
  }

  @Get('/api/changelogs')
  async changelogs() {
    try {
      const response = await axios.get(
        'https://api.github.com/repos/heyform/heyform/releases'
      )

      return response.data.map(item => ({
        id: item.id.toString(),
        title: item.name,
        html: item.body,
        publishedAt: item.published_at
      }))
    } catch (error) {
      return []
    }
  }
}
