import { apollo } from '@/utils'

import { APPS_GQL } from '@/consts'

export class AppService {
  static async apps() {
    return apollo.query({
      query: APPS_GQL
    })
  }

  static async detail(_clientId: any, _redirectUri: any): Promise<any> {
    return {}
  }

  static async authorizationCode(_clientId: any, _redirectUri: any): Promise<any> {
    return ''
  }
}
