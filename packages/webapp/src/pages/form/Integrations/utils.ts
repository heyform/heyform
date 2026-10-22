import { TFunction } from 'i18next'

import { AppSettingType, IntegratedAppType } from '@/types'

export function getIntegrationDescription(t: TFunction, app: IntegratedAppType) {
  return t(`form.integrations.apps.${app.id}.description`, {
    defaultValue: app.description
  })
}

export function getIntegrationSetting(
  t: TFunction,
  app: IntegratedAppType,
  setting: AppSettingType
) {
  return {
    ...setting,
    label: t(`form.integrations.apps.${app.id}.settings.${setting.name}.label`, {
      defaultValue: setting.label
    }),
    description: setting.description
      ? t(`form.integrations.apps.${app.id}.settings.${setting.name}.description`, {
          defaultValue: setting.description
        })
      : undefined,
    options: setting.options?.map(option => ({
      ...option,
      label: t(
        `form.integrations.apps.${app.id}.settings.${setting.name}.options.${option.value}`,
        {
          defaultValue: option.label
        }
      )
    }))
  }
}

export function getIntegrationDefaultConfig(app: IntegratedAppType) {
  return Object.fromEntries(
    (app.settings || [])
      .filter(setting => setting.defaultValue !== undefined && setting.defaultValue !== null)
      .map(setting => [setting.name, setting.defaultValue])
  )
}
