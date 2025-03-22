import { EventStreamContentType, fetchEventSource } from '@fortaine/fetch-event-source'
import {
  FormField,
  FormKindEnum,
  FormStatusEnum,
  FormTheme,
  HiddenField,
  InteractiveModeEnum,
  Logic,
  Variable
} from '@heyform-inc/shared-types-enums'
import { parse } from 'best-effort-json-parser'

import {
  CREATE_FIELDS_WITH_AI_GQL,
  CREATE_FORM_CUSTOM_REPORT_GQL,
  CREATE_FORM_FIELD_GQL,
  CREATE_FORM_GQL,
  CREATE_FORM_LOGICS_WITH_AI_GQL,
  CREATE_FORM_THEME_WITH_AI_GQL,
  CREATE_FORM_WITH_AI_GQL,
  DELETE_FORM_FIELD_GQL,
  DELETE_FORM_GQL,
  DUPLICATE_FORM_GQL,
  FORMS_GQL,
  FORM_ANALYTIC_GQL,
  FORM_DETAIL_GQL,
  FORM_INTEGRATIONS_GQL,
  FORM_REPORT_GQL,
  FORM_SUMMARY_GQL,
  IMPORT_FORM_GQL,
  MOVE_FORM_TO_PROJECT_GQL,
  MOVE_FORM_TO_TRASH_GQL,
  PUBLISH_FORM_SQL,
  RESTORE_FORM_GQL,
  SEARCH_FORM_GQL,
  TEMPLATES_GQL,
  TEMPLATE_DETAILS_GQL,
  UPDATE_FORM_ARCHIVE_GQL,
  UPDATE_FORM_CUSTOM_REPORT_GQL,
  UPDATE_FORM_FIELD_GQL,
  UPDATE_FORM_GQL,
  UPDATE_FORM_HIDDEN_FIELDS_GQL,
  UPDATE_FORM_INTEGRATIONS_GQL,
  UPDATE_FORM_LOGICS_GQL,
  UPDATE_FORM_SCHEMAS_GQL,
  UPDATE_FORM_THEME_GQL,
  UPDATE_FORM_VARIABLES_GQL,
  USE_TEMPLATE_GQL
} from '@/consts'
import { TemplateType } from '@/types'
import { apollo, clearAuthState } from '@/utils'

interface ChatOptions {
  onMessage: (data: AnyMap) => void
  onError: (error: string) => void
  onClose: () => void
}

export class FormService {
  static async forms(projectId: string, status = FormStatusEnum.NORMAL) {
    return apollo.query({
      query: FORMS_GQL,
      variables: {
        input: {
          projectId,
          status
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static create(input: {
    projectId: string
    name: string
    nameSchema?: string[]
    interactiveMode: InteractiveModeEnum
    kind: FormKindEnum
  }) {
    return apollo.mutate({
      mutation: CREATE_FORM_GQL,
      variables: {
        input
      }
    })
  }

  static createWithAI(input: { projectId: string; topic: string; reference?: string }) {
    return apollo.mutate({
      mutation: CREATE_FORM_WITH_AI_GQL,
      variables: {
        input
      }
    })
  }

  static createFieldsWithAI(formId: string, prompt: string) {
    return apollo.mutate({
      mutation: CREATE_FIELDS_WITH_AI_GQL,
      variables: {
        input: {
          formId,
          prompt
        }
      }
    })
  }

  static createLogicsWithAI(formId: string, prompt: string) {
    return apollo.mutate({
      mutation: CREATE_FORM_LOGICS_WITH_AI_GQL,
      variables: {
        input: {
          formId,
          prompt
        }
      }
    })
  }

  static createThemesWithAI(formId: string, prompt: string, theme: string) {
    return apollo.mutate({
      mutation: CREATE_FORM_THEME_WITH_AI_GQL,
      variables: {
        input: {
          formId,
          prompt,
          theme
        }
      }
    })
  }

  static import(projectId: string, url: string) {
    return apollo.mutate({
      mutation: IMPORT_FORM_GQL,
      variables: {
        input: {
          projectId,
          url
        }
      }
    })
  }

  static async analytic(formId: string, range: string) {
    return apollo.query({
      query: FORM_ANALYTIC_GQL,
      variables: {
        input: {
          formId,
          range
        }
      },
      fetchPolicy: 'cache-first'
    })
  }

  static async report(formId: string) {
    return apollo.query({
      query: FORM_REPORT_GQL,
      variables: {
        input: {
          formId
        }
      },
      fetchPolicy: 'cache-first'
    })
  }

  static async summary(formId: string) {
    return apollo.query({
      query: FORM_SUMMARY_GQL,
      variables: {
        input: {
          formId
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static async detail(formId: string) {
    return apollo.query({
      query: FORM_DETAIL_GQL,
      variables: {
        input: {
          formId
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static updateFormSchemas(input: { formId: string; drafts: AnyMap[]; version: number }) {
    return apollo.mutate({
      mutation: UPDATE_FORM_SCHEMAS_GQL,
      variables: {
        input
      }
    })
  }

  static publishForm(input: { formId: string; drafts: AnyMap[]; version: number }) {
    return apollo.mutate({
      mutation: PUBLISH_FORM_SQL,
      variables: {
        input
      }
    })
  }

  static updateLogics(formId: string, logics: Logic[]) {
    return apollo.mutate({
      mutation: UPDATE_FORM_LOGICS_GQL,
      variables: {
        input: {
          formId,
          logics
        }
      }
    })
  }

  static updateVariables(formId: string, variables: Variable[]) {
    return apollo.mutate({
      mutation: UPDATE_FORM_VARIABLES_GQL,
      variables: {
        input: {
          formId,
          variables
        }
      }
    })
  }

  static updateHiddenFields(formId: string, hiddenFields: HiddenField[]) {
    return apollo.mutate({
      mutation: UPDATE_FORM_HIDDEN_FIELDS_GQL,
      variables: {
        input: {
          formId,
          hiddenFields
        }
      }
    })
  }

  static update(formId: string, updates: AnyMap) {
    return apollo.mutate({
      mutation: UPDATE_FORM_GQL,
      variables: {
        input: {
          formId,
          ...updates
        }
      }
    })
  }

  static updateArchive(formId: string, allowArchive: boolean) {
    return apollo.mutate({
      mutation: UPDATE_FORM_ARCHIVE_GQL,
      variables: {
        input: {
          formId,
          allowArchive
        }
      }
    })
  }

  static updateTheme(input: { formId: string; theme: FormTheme; logo?: string }) {
    return apollo.mutate({
      mutation: UPDATE_FORM_THEME_GQL,
      variables: {
        input
      }
    })
  }

  static createField(formId: string, field: Partial<FormField>) {
    return apollo.mutate({
      mutation: CREATE_FORM_FIELD_GQL,
      variables: {
        input: {
          formId,
          field
        }
      }
    })
  }

  static updateField(input: { formId: string; fieldId: string; updates: Partial<FormField> }) {
    return apollo.mutate({
      mutation: UPDATE_FORM_FIELD_GQL,
      variables: {
        input
      }
    })
  }

  static deleteField(formId: string, fieldId: string) {
    return apollo.mutate({
      mutation: DELETE_FORM_FIELD_GQL,
      variables: {
        input: {
          formId,
          fieldId
        }
      }
    })
  }

  static async integrations(formId: string) {
    return apollo.query({
      query: FORM_INTEGRATIONS_GQL,
      fetchPolicy: 'no-cache',
      variables: {
        input: {
          formId
        }
      }
    })
  }

  static updateIntegration(input: { formId: string; appId: string; attributes: AnyMap }) {
    return apollo.mutate({
      mutation: UPDATE_FORM_INTEGRATIONS_GQL,
      variables: {
        input
      }
    })
  }

  static duplicate(formId: string, name: string) {
    return apollo.mutate({
      mutation: DUPLICATE_FORM_GQL,
      variables: {
        input: {
          formId,
          name
        }
      }
    })
  }

  static search(keyword: string) {
    return apollo.query({
      query: SEARCH_FORM_GQL,
      variables: {
        input: {
          keyword
        }
      }
    })
  }

  static moveToTrash(formId: string) {
    return apollo.mutate({
      mutation: MOVE_FORM_TO_TRASH_GQL,
      variables: {
        input: {
          formId
        }
      }
    })
  }

  static restoreForm(formId: string) {
    return apollo.mutate({
      mutation: RESTORE_FORM_GQL,
      variables: {
        input: {
          formId
        }
      }
    })
  }

  static moveToProject(formId: string, targetProjectId: string) {
    return apollo.mutate({
      mutation: MOVE_FORM_TO_PROJECT_GQL,
      variables: {
        input: {
          formId,
          targetProjectId
        }
      }
    })
  }

  static delete(formId: string) {
    return apollo.mutate({
      mutation: DELETE_FORM_GQL,
      variables: {
        input: {
          formId
        }
      }
    })
  }

  static templates(): Promise<TemplateType[]> {
    return apollo.query({
      query: TEMPLATES_GQL,
      fetchPolicy: 'cache-first',
      variables: {
        input: {
          limit: 0
        }
      }
    })
  }

  static templateDetail(templateId: string) {
    return apollo.query({
      query: TEMPLATE_DETAILS_GQL,
      variables: {
        input: {
          templateId
        }
      }
    })
  }

  static useTemplate(input: { projectId: string; templateId: string; recordId: string }) {
    return apollo.mutate({
      mutation: USE_TEMPLATE_GQL,
      variables: {
        input
      }
    })
  }

  static async chat(
    formId: string,
    prompt: string,
    language: string,
    { onMessage, onError, onClose }: ChatOptions
  ) {
    const controller = new AbortController()
    const requestTimeoutId = setTimeout(() => controller.abort(), 30_000)
    let responseText = ''

    await fetchEventSource('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formId,
        prompt,
        language
      }),
      signal: controller.signal,
      credentials: 'include',

      async onopen(res) {
        clearTimeout(requestTimeoutId)

        if (res.status === 401) {
          clearAuthState()
          window.location.href = '/logout'
          return
        }

        const contentType = res.headers.get('content-type')

        if (!res.ok || res.status !== 200 || !contentType?.startsWith(EventStreamContentType)) {
          const json = await res.clone().json()

          controller.abort()
          onError(json.message)
        }
      },

      onmessage({ event, data }) {
        responseText += data

        if (event === 'error') {
          return onError(data)
        } else if (data.includes('[ERROR]')) {
          return onError(data.replace('[ERROR]', '').trim())
        }

        try {
          onMessage(parse(responseText))
        } catch {}
      },

      onclose() {
        controller.abort()

        try {
          onMessage(parse(responseText))
        } catch {}

        onClose()
      },

      onerror(err) {
        onError(err.message)
      },

      openWhenHidden: true
    })

    return controller
  }

  static createCustomReport(formId: string) {
    return apollo.mutate({
      mutation: CREATE_FORM_CUSTOM_REPORT_GQL,
      variables: {
        input: {
          formId
        }
      }
    })
  }

  static updateCustomReport(input: {
    formId: string
    hiddenFields?: string[]
    theme?: AnyMap
    enablePublicAccess?: boolean
  }) {
    return apollo.mutate({
      mutation: UPDATE_FORM_CUSTOM_REPORT_GQL,
      variables: {
        input
      }
    })
  }
}
