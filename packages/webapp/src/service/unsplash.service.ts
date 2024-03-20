import { UNSPLASH_SEARCH_GQL, UNSPLASH_TRACK_DOWNLOAD_GQL } from '@/consts'
import { request } from '@/utils'

export class UnsplashService {
  static async search(keyword?: string) {
    return request.query({
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
    return request.mutate({
      mutation: UNSPLASH_TRACK_DOWNLOAD_GQL,
      variables: {
        input: {
          downloadUrl
        }
      }
    })
  }
}
