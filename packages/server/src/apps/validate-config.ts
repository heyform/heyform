import { BadRequestException } from '@nestjs/common'

import { isHttpUrl, isHttpsUrl } from '@utils'

import { AppConfig, AppDefinition, AppSetting } from './types'

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
      if (!setting.options.some(option => option.value === value)) {
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

/**
 * Checks a submitted integration config against the app's settings and returns
 * the config to store: only declared settings, with defaults applied to blank
 * optional ones. Runs the app's own `validate` hook last.
 */
export async function validateAppConfig(app: AppDefinition, config: unknown): Promise<AppConfig> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new BadRequestException('Invalid integration config')
  }

  const input = config as Record<string, unknown>
  const result: AppConfig = {}

  for (const setting of app.settings) {
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

  await app.validate?.(result)

  return result
}
