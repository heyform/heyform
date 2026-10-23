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

// How HeyForm authenticates with the app's service. HeyForm stores the
// credentials and hands run() a ready-to-use value, so app code never handles
// storage, encryption or token expiry.
export interface NoneAppAuth {
  type: 'none'
}

// The form owner pastes an API key in the integration settings. It is stored
// encrypted and never sent back to the browser.
export interface ApiKeyAppAuth {
  type: 'apiKey'
  // Label and help text of the key input; the label defaults to "API key"
  label?: string
  description?: string
}

// The form owner connects an account through the provider's OAuth2 flow.
export interface OAuth2AppAuth {
  type: 'oauth2'
  // Id of a provider in ./oauth2-providers.ts
  provider: string
  scopes: string[]
}

export type AppAuth = NoneAppAuth | ApiKeyAppAuth | OAuth2AppAuth

// What run() receives as `auth` for each auth type
export type AppRunAuth<A extends AppAuth = AppAuth> = A extends ApiKeyAppAuth
  ? { type: 'apiKey'; apiKey: string }
  : A extends OAuth2AppAuth
    ? { type: 'oauth2'; accessToken: string }
    : { type: 'none' }

// Overrides the global BULL_JOB_* defaults for this app's delivery jobs
export interface AppQueueOptions {
  // Total tries, including the first
  attempts?: number
  // Delay between tries in milliseconds, or a Bull backoff strategy
  backoff?: number | { type: 'fixed' | 'exponential'; delay: number }
  // Milliseconds before a try is failed
  timeout?: number
}

export type AppConfig = Record<string, any>

export interface AppRunContext<A extends AppAuth = AppAuth> {
  submission: SubmissionModel
  form: FormModel
  config: AppConfig
  auth: AppRunAuth<A>
}

export interface AppDefinition<A extends AppAuth = AppAuth> {
  id: string
  name: string
  description: string
  // Path served by the server, e.g. `/static/webhook.png`
  icon: string
  auth: A
  settings: Array<AppSetting & { required: boolean }>
  queue?: AppQueueOptions
  // Runs after the config has passed the generic settings validation.
  // Throw a BadRequestException to reject it.
  validate?(config: AppConfig): Promise<void>
  run(ctx: AppRunContext<A>): Promise<unknown>
}

export type AppDefinitionInput<A extends AppAuth> = Omit<AppDefinition<A>, 'auth' | 'settings'> & {
  auth?: A
  settings: AppSetting[]
}

function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isDelay(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

// Catches mistakes in an app file when the server starts, rather than when
// the first submission is delivered
function assertValidDefinition(app: AppDefinitionInput<AppAuth>) {
  const auth = app.auth

  if (auth?.type === 'oauth2' && (!auth.provider || !auth.scopes?.length)) {
    throw new Error(`App ${app.id}: oauth2 auth needs a provider and at least one scope`)
  }

  const queue = app.queue

  if (queue) {
    if (queue.attempts !== undefined && !isPositiveInteger(queue.attempts)) {
      throw new Error(`App ${app.id}: queue.attempts must be a positive integer`)
    }

    if (queue.timeout !== undefined && !isPositiveInteger(queue.timeout)) {
      throw new Error(`App ${app.id}: queue.timeout must be a positive number of milliseconds`)
    }

    const backoff = queue.backoff

    if (
      backoff !== undefined &&
      !(typeof backoff === 'number'
        ? isDelay(backoff)
        : ['fixed', 'exponential'].includes(backoff?.type) && isDelay(backoff?.delay))
    ) {
      throw new Error(`App ${app.id}: queue.backoff must be a delay or { type, delay }`)
    }
  }
}

export function defineApp<A extends AppAuth = NoneAppAuth>(
  app: AppDefinitionInput<A>
): AppDefinition {
  assertValidDefinition(app)

  return {
    ...app,
    auth: app.auth ?? { type: 'none' },
    settings: app.settings.map(setting => ({
      ...setting,
      required: setting.required ?? false
    }))
  } as AppDefinition
}
