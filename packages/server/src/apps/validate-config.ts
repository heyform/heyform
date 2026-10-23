import { BadRequestException } from '@nestjs/common'

import type { FormModel } from '@model'
import { isHttpUrl, isHttpsUrl } from '@utils'

import { AppConfig, AppDefinition, AppError, AppRunAuth, AppSetting } from './types'

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim())
}

function invalid(setting: AppSetting, reason: string): BadRequestException {
  return new BadRequestException(`${setting.label} ${reason}`)
}

function validateSettingValue(setting: AppSetting, value: unknown): unknown {
  switch (setting.type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') {
        throw invalid(setting, 'must be text')
      }
      return value

    case 'url':
      if (typeof value !== 'string' || !(isHttpUrl(value) || isHttpsUrl(value))) {
        throw invalid(setting, 'must be a valid http(s) URL')
      }
      return value

    case 'select':
      // Loaded options can't be checked here; the app's validate does
      if (
        setting.options
          ? !setting.options.some(option => option.value === value)
          : typeof value !== 'string'
      ) {
        throw invalid(setting, 'must be one of the available options')
      }
      return value

    case 'switch':
      if (typeof value !== 'boolean') {
        throw invalid(setting, 'must be true or false')
      }
      return value

    default:
      throw new BadRequestException(`Unsupported setting type: ${(setting as AppSetting).type}`)
  }
}

// Whether a setting is shown, given the values of the settings before it
export function isSettingVisible(setting: AppSetting, config: AppConfig): boolean {
  return Object.entries(setting.visibleWhen ?? {}).every(
    ([name, expected]) =>
      (config[name] ?? (typeof expected === 'boolean' ? false : undefined)) === expected
  )
}

export interface ValidateAppConfigContext {
  form: FormModel
  // Calls the app's validate with credentials, if it has one. Defaults to
  // `{ type: 'none' }`.
  withAuth?: <T>(fn: (auth: AppRunAuth) => Promise<T>) => Promise<T>
}

/**
 * Checks a submitted integration config against the app's settings and returns
 * the config to store: only declared, visible settings, with defaults applied
 * to blank optional ones. Runs the app's own `validate` hook last, which may
 * return the config to store instead.
 */
export async function validateAppConfig(
  app: AppDefinition,
  config: unknown,
  ctx?: ValidateAppConfigContext
): Promise<AppConfig> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new BadRequestException('Invalid integration config')
  }

  const input = config as Record<string, unknown>
  const result: AppConfig = {}

  for (const setting of app.settings) {
    if (!isSettingVisible(setting, result)) {
      continue
    }

    let value = Object.prototype.hasOwnProperty.call(input, setting.name)
      ? input[setting.name]
      : undefined

    if (isBlank(value)) {
      value = setting.type === 'switch' ? (setting.defaultValue ?? false) : setting.defaultValue
    }

    if (isBlank(value)) {
      if (setting.required) {
        throw invalid(setting, 'is required')
      }
      continue
    }

    result[setting.name] = validateSettingValue(setting, value)
  }

  if (!app.validate) {
    return result
  }

  const withAuth = ctx?.withAuth ?? (fn => fn({ type: 'none' }))

  try {
    const validated = await withAuth(auth =>
      app.validate!(result, { form: ctx?.form as FormModel, auth })
    )
    return validated || result
  } catch (err) {
    if (err instanceof AppError) {
      throw new BadRequestException(err.message)
    }
    throw err
  }
}
