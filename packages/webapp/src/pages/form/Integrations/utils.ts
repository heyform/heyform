import { TFunction } from 'i18next'

import { INTEGRATION_CONNECTION_STATUS_ENUM } from '@/consts'
import { AppSettingType, IntegratedAppType, IntegrationConnectionType } from '@/types'

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

// The server redirects to the provider and back to the integrations page
export function getIntegrationAuthorizeUrl(formId: string, appId: string) {
  return `/api/integrations/oauth/authorize?${new URLSearchParams({ formId, appId })}`
}

// An OAuth2 app shows the connect step instead of its settings until the
// workspace has an account to pick
export function needsAccountConnection(
  app: IntegratedAppType,
  connections: IntegrationConnectionType[] = []
) {
  return app.auth?.type === 'oauth2' && connections.length === 0
}

// "<email> (connected by <name>)", and why it can't be used, if it can't
export function getConnectionLabel(
  t: TFunction,
  app: IntegratedAppType,
  connection: IntegrationConnectionType
) {
  const account = connection.accountEmail || connection.accountName || connection.id
  const label = connection.connectedBy
    ? t('form.integrations.auth.accountLabel', { email: account, name: connection.connectedBy })
    : account

  if (connection.hasScopes === false) {
    return t('form.integrations.auth.accountMissingAccess', { label, app: app.name })
  }

  if (connection.status === INTEGRATION_CONNECTION_STATUS_ENUM.NEEDS_RECONNECT) {
    return t('form.integrations.auth.accountNeedsReconnect', { label })
  }

  return label
}

export function getIntegrationAuth(t: TFunction, app: IntegratedAppType) {
  const auth = app.auth

  return {
    providerName: auth?.providerName || app.name,
    label: t(`form.integrations.apps.${app.id}.auth.label`, {
      defaultValue: auth?.label || t('form.integrations.auth.apiKey')
    }),
    description: auth?.description
      ? t(`form.integrations.apps.${app.id}.auth.description`, {
          defaultValue: auth.description
        })
      : undefined
  }
}
