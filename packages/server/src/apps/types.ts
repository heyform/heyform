import type { FormModel, SubmissionModel } from '@model'

export interface AppSettingOption {
  label: string
  value: string
}

interface BaseAppSetting {
  // Key of the value in the integration's config
  name: string
  label: string
  description?: string
  placeholder?: string
  required?: boolean
}

export interface TextAppSetting extends BaseAppSetting {
  type: 'text'
  defaultValue?: string
}

export interface UrlAppSetting extends BaseAppSetting {
  type: 'url'
  defaultValue?: string
}

export interface TextareaAppSetting extends BaseAppSetting {
  type: 'textarea'
  defaultValue?: string
}

export interface SelectAppSetting extends BaseAppSetting {
  type: 'select'
  options: AppSettingOption[]
  defaultValue?: string
}

export interface SwitchAppSetting extends BaseAppSetting {
  type: 'switch'
  defaultValue?: boolean
}

export type AppSetting =
  | TextAppSetting
  | UrlAppSetting
  | TextareaAppSetting
  | SelectAppSetting
  | SwitchAppSetting

// How HeyForm authenticates with the app. Only `none` is implemented;
// `apiKey` and `oauth2` arrive in a later PR.
export type AppAuth = { type: 'none' }

export type AppConfig = Record<string, any>

export interface AppRunContext {
  submission: SubmissionModel
  form: FormModel
  config: AppConfig
}

export interface AppDefinition {
  id: string
  name: string
  description: string
  // Path served by the server, e.g. `/static/webhook.png`
  icon: string
  auth: AppAuth
  settings: Array<AppSetting & { required: boolean }>
  // Runs after the config has passed the generic settings validation.
  // Throw a BadRequestException to reject it.
  validate?(config: AppConfig): Promise<void>
  run(ctx: AppRunContext): Promise<unknown>
}

export type AppDefinitionInput = Omit<AppDefinition, 'auth' | 'settings'> & {
  auth?: AppAuth
  settings: AppSetting[]
}

export function defineApp(app: AppDefinitionInput): AppDefinition {
  return {
    ...app,
    auth: app.auth ?? { type: 'none' },
    settings: app.settings.map(setting => ({
      ...setting,
      required: setting.required ?? false
    }))
  }
}
