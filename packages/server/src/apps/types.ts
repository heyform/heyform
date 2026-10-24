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
  // Shows the setting only while each named setting, declared earlier, has
  // the given value, e.g. `{ createSpreadsheet: false }`. A hidden setting
  // isn't required, and its value isn't stored.
  visibleWhen?: Record<string, string | boolean>
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

export interface SelectAppSetting<A extends AppAuth = AppAuth> extends BaseAppSetting {
  type: 'select'
  // Fixed options, or `loadOptions` to load them from the app's service
  options?: AppSettingOption[]
  // Called when the settings open, and again when a setting named in
  // `dependsOn` changes, with the values in the form and fresh credentials.
  // The server can't check a saved value against options it loads, so
  // `validate` should.
  loadOptions?(ctx: AppLoadOptionsContext<A>): Promise<AppSettingOption[]>
  // Settings whose values the loader reads. It isn't called while one of
  // them is blank.
  dependsOn?: string[]
  defaultValue?: string
}

export interface SwitchAppSetting extends BaseAppSetting {
  type: 'switch'
  defaultValue?: boolean
}

export type AppSetting<A extends AppAuth = AppAuth> =
  | TextAppSetting
  | UrlAppSetting
  | TextareaAppSetting
  | SelectAppSetting<A>
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

export interface AppValidateContext<A extends AppAuth = AppAuth> {
  form: FormModel
  // The credentials being saved: the API key entered (or the saved one), or
  // the picked account's access token
  auth: AppRunAuth<A>
}

export interface AppLoadOptionsContext<A extends AppAuth = AppAuth> {
  // The values in the settings form, not yet validated or saved
  config: AppConfig
  auth: AppRunAuth<A>
}

/**
 * An error an app throws from `run`, `validate` or `loadOptions` to say what
 * went wrong and whether trying again can help. Its message is shown to the
 * form owner, in the delivery log or the settings form, so keep secrets and
 * submission data out of it.
 */
export class AppError extends Error {
  // Whether another try could succeed, e.g. after a rate limit or an outage.
  // A delivery that fails with a non-retryable error isn't tried again.
  readonly retryable: boolean
  // The service rejected the access token, e.g. because access was revoked
  // before the token expired. HeyForm refreshes the token and calls the app
  // once more; if the provider refuses to refresh it, the account needs
  // reconnecting and the submission waits.
  readonly unauthorized: boolean

  constructor(message: string, options: { retryable?: boolean; unauthorized?: boolean } = {}) {
    super(message)
    this.name = 'AppError'
    this.retryable = options.retryable ?? true
    this.unauthorized = options.unauthorized ?? false
  }

  // The usual meaning of an HTTP error status: 401 is an unauthorized token,
  // 408, 429 and 5xx are worth retrying, and other 4xx aren't
  static fromStatus(status: number, message: string): AppError {
    return new AppError(message, {
      unauthorized: status === 401,
      retryable: status === 408 || status === 429 || status >= 500
    })
  }
}

export interface AppDefinition<A extends AppAuth = AppAuth> {
  id: string
  name: string
  description: string
  // Path served by the server, e.g. `/static/webhook.png`
  icon: string
  auth: A
  settings: Array<AppSetting<A> & { required: boolean }>
  queue?: AppQueueOptions
  // Runs after the config has passed the generic settings validation. Throw
  // an AppError or a BadRequestException to reject it, or return the config
  // to store instead, e.g. with a pasted URL reduced to an id.
  validate?(config: AppConfig, ctx: AppValidateContext<A>): Promise<AppConfig | void>
  run(ctx: AppRunContext<A>): Promise<unknown>
}

export type AppDefinitionInput<A extends AppAuth> = Omit<AppDefinition<A>, 'auth' | 'settings'> & {
  auth?: A
  settings: AppSetting<A>[]
}

function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isDelay(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

// Loaded selects have no fixed options, and settings only refer to ones
// declared before them, which the form renders first
function assertValidSettings(app: AppDefinitionInput<AppAuth>) {
  const declared = new Set<string>()

  for (const setting of app.settings) {
    if (setting.type === 'select' && !setting.options === !setting.loadOptions) {
      throw new Error(`App ${app.id}: select ${setting.name} needs either options or loadOptions`)
    }

    const references = [
      ...Object.keys(setting.visibleWhen ?? {}),
      ...(setting.type === 'select' ? (setting.dependsOn ?? []) : [])
    ]

    for (const name of references) {
      if (!declared.has(name)) {
        throw new Error(
          `App ${app.id}: ${setting.name} refers to ${name}, which isn't declared before it`
        )
      }
    }

    declared.add(setting.name)
  }
}

// Catches mistakes in an app file when the server starts, rather than when
// the first submission is delivered
function assertValidDefinition(app: AppDefinitionInput<AppAuth>) {
  assertValidSettings(app)

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
