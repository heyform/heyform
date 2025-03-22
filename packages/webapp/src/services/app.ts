import axios from 'axios'

import { APPS_GQL, APP_AUTHORIZE_URL_GQL, APP_DETAIL_GQL, CDN_UPLOAD_URL } from '@/consts'
import { apollo } from '@/utils'

export class AppService {
  static async apps() {
    return apollo.query({
      query: APPS_GQL
    })
  }

  static async detail(clientId: string, redirectUri: string) {
    return apollo.query({
      query: APP_DETAIL_GQL,
      variables: {
        input: {
          clientId,
          redirectUri
        }
      }
    })
  }

  static async authorizationCode(clientId: string, redirectUri: string) {
    return apollo.query({
      query: APP_AUTHORIZE_URL_GQL,
      variables: {
        input: {
          clientId,
          redirectUri,
          responseType: 'code'
        }
      }
    })
  }

  static async upload(file: File, key: string, token: string) {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('key', key)
    formData.append('token', token)

    return axios.post(CDN_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
