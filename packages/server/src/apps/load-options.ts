import { BadRequestException, HttpException } from '@nestjs/common'

import { Logger } from '@utils'

import { AppConfig, AppDefinition, AppError, AppRunAuth, AppSettingOption } from './types'

// What a loader may return, so a large or odd result can't flood the
// settings form
export const MAX_LOADED_OPTIONS = 500
export const MAX_OPTION_LABEL_LENGTH = 200
export const MAX_OPTION_VALUE_LENGTH = 500

const logger = new Logger('AppLoadOptions')

// Keeps the first MAX_LOADED_OPTIONS options with a usable value, and
// shortens long labels
export function limitOptions(options: unknown): AppSettingOption[] {
  if (!Array.isArray(options)) {
    return []
  }

  const result: AppSettingOption[] = []

  for (const option of options) {
    const value = option?.value

    if (
      !['string', 'number'].includes(typeof value) ||
      String(value) === '' ||
      String(value).length > MAX_OPTION_VALUE_LENGTH
    ) {
      continue
    }

    let label = String(option.label ?? value)

    if (label.length > MAX_OPTION_LABEL_LENGTH) {
      label = `${label.slice(0, MAX_OPTION_LABEL_LENGTH - 1)}…`
    }

    result.push({ label, value: String(value) })

    if (result.length === MAX_LOADED_OPTIONS) {
      break
    }
  }

  return result
}

// The values in the settings form a loader may read: declared settings only
function pickSettingValues(app: AppDefinition, values: unknown): AppConfig {
  const input = values && typeof values === 'object' ? (values as Record<string, unknown>) : {}
  const config: AppConfig = {}

  for (const setting of app.settings) {
    const value = Object.prototype.hasOwnProperty.call(input, setting.name)
      ? input[setting.name]
      : undefined

    if (typeof value === 'string' || typeof value === 'boolean') {
      config[setting.name] = value
    }
  }

  return config
}

/**
 * Loads the options of a select setting that has `loadOptions`. `withAuth`
 * calls the loader with credentials. An AppError's message is shown to the
 * form owner; other errors are logged and replaced with a generic message.
 */
export async function loadSettingOptions(
  app: AppDefinition,
  settingName: string,
  values: unknown,
  withAuth: <T>(fn: (auth: AppRunAuth) => Promise<T>) => Promise<T>
): Promise<AppSettingOption[]> {
  const setting = app.settings.find(row => row.name === settingName)

  if (setting?.type !== 'select' || !setting.loadOptions) {
    throw new BadRequestException(`${app.name} has no options to load for ${settingName}`)
  }

  const config = pickSettingValues(app, values)

  try {
    return limitOptions(await withAuth(auth => setting.loadOptions!({ config, auth })))
  } catch (err: any) {
    if (err instanceof AppError) {
      throw new BadRequestException(err.message)
    }

    // e.g. the account needs reconnecting
    if (err instanceof HttpException) {
      throw err
    }

    logger.error(`Loading ${app.id}.${settingName} options failed: ${err?.message}`)
    throw new BadRequestException(`Couldn't load the options for ${setting.label}`)
  }
}
