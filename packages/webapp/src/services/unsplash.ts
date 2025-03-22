import { UNSPLASH_SEARCH_GQL, UNSPLASH_TRACK_DOWNLOAD_GQL } from '@/consts'
import { apollo } from '@/utils'

export class UnsplashService {
  static async search(keyword?: string) {
    return apollo.query({
      query: UNSPLASH_SEARCH_GQL,
      variables: {
        input: {
          keyword
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static trackDownload(downloadUrl: string) {
    return apollo.mutate({
      mutation: UNSPLASH_TRACK_DOWNLOAD_GQL,
      variables: {
        input: {
          downloadUrl
        }
      }
    })
  }
}
