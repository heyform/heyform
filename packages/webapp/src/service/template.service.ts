import { TEMPLATES_GQL, TEMPLATE_DETAIL_GQL, USE_TEMPLATE_GQL } from '@/consts'
import { request } from '@/utils'

export class TemplateService {
  static async templates(input: { keyword?: string; limit?: number } = {}) {
    return request.query({
      query: TEMPLATES_GQL,
      variables: {
        input
      }
    })
  }

  static async detail(templateId: string) {
    return request.query({
      query: TEMPLATE_DETAIL_GQL,
      variables: {
        input: {
          templateId
        }
      }
    })
  }

  static async useTemplate(projectId: string, templateId: string) {
    return request.mutate({
      mutation: USE_TEMPLATE_GQL,
      variables: {
        input: {
          projectId,
          templateId
        }
      }
    })
  }
}
