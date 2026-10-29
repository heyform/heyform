import axios from 'axios'

import { ChangelogType } from '@/types'

export class ChangelogService {
  static async latest(): Promise<Pick<ChangelogType, 'id' | 'publishedAt'> | null> {
    return (await axios.get('/api/changelog/latest')).data
  }

  static async list(): Promise<ChangelogType[]> {
    return (await axios.get('/api/changelogs')).data
  }
}
