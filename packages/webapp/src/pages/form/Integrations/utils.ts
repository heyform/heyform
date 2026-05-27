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
      : undefined
  }
}
