/**
 * @program: dashboard-next
 * @description: Integration Service
 * @author: Mufeng
 * @date: 2021-06-16 11:42
 **/
import {
  DELETE_INTEGRATION_SETTINGS_GQL,
  THIRD_PARTY_OAUTH_URL_GQL,
  UPDATE_INTEGRATION_SETTINGS_GQL,
  UPDATE_INTEGRATION_STATUS_GQL
} from '@/consts'
import { IntegrationStatusEnum } from '@/models'
import { request } from '@/utils'

export class IntegrationService {
  static async oauthUrl(formId: string, appId: string) {
    return request.query({
      query: THIRD_PARTY_OAUTH_URL_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async updateSettings(formId: string, appId: string, data: Record<string, any>) {
    return request.mutate({
      mutation: UPDATE_INTEGRATION_SETTINGS_GQL,
      variables: {
        input: {
          formId,
          appId,
          ...data
        }
      }
    })
  }

  static async updateStatus(formId: string, appId: string, status: IntegrationStatusEnum) {
    return request.mutate({
      mutation: UPDATE_INTEGRATION_STATUS_GQL,
      variables: {
        input: {
          formId,
          appId,
          status
        }
      }
    })
  }

  static async deleteSettings(formId: string, appId: string) {
    return request.mutate({
      mutation: DELETE_INTEGRATION_SETTINGS_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }
}
