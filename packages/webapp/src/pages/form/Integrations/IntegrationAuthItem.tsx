import { useTranslation } from 'react-i18next'

import { getConnectionLabel, getIntegrationAuth, getIntegrationAuthorizeUrl } from './utils'

import { Button, Form, Input, Select } from '@/components'
import { INTEGRATION_STATUS_ENUM } from '@/consts'
import { IntegratedAppType, IntegrationConnectionType } from '@/types'

// The key input for `apiKey` apps. The saved key is never sent back, so
// leaving the input blank keeps it.
export function ApiKeyItem({ app }: { app: IntegratedAppType }) {
  const { t } = useTranslation()
  const { label, description } = getIntegrationAuth(t, app)
  const hint = app.integration?.apiKeyHint

  return (
    <Form.Item
      name="apiKey"
      label={label}
      footer={
        description || hint ? (
          <>
            {description && <div>{description}</div>}
            {hint && <div>{t('form.integrations.auth.apiKeySaved', { hint })}</div>}
          </>
        ) : undefined
      }
      rules={[
        {
          required: !hint,
          whitespace: true
        }
      ]}
    >
      <Input type="password" autoComplete="off" placeholder={hint} />
    </Form.Item>
  )
}

// Connect step for `oauth2` apps, before the settings
export function ConnectAccount({ app, formId }: { app: IntegratedAppType; formId: string }) {
  const { t } = useTranslation()
  const { providerName } = getIntegrationAuth(t, app)
  const isReconnect = app.integration?.status === INTEGRATION_STATUS_ENUM.NEEDS_RECONNECT

  function handleClick() {
    window.location.assign(getIntegrationAuthorizeUrl(formId, app.id))
  }

  return (
    <div className="space-y-4">
      <p className="text-secondary text-center text-sm">
        {isReconnect
          ? t('form.integrations.auth.needsReconnect', { name: providerName })
          : t('form.integrations.auth.connectDescription', { name: providerName })}
      </p>
      <Button className="w-full" onClick={handleClick}>
        {t(
          isReconnect
            ? 'form.integrations.auth.reconnectAccount'
            : 'form.integrations.auth.connectAccount',
          { name: providerName }
        )}
      </Button>
    </div>
  )
}

// Account picker for `oauth2` apps: any account the workspace has connected,
// labelled with whose it is, or connect another one
export function ConnectionItem({
  app,
  formId,
  connections
}: {
  app: IntegratedAppType
  formId: string
  connections: IntegrationConnectionType[]
}) {
  const { t } = useTranslation()
  const { providerName } = getIntegrationAuth(t, app)

  const options = connections.map(connection => ({
    value: connection.id,
    label: getConnectionLabel(t, app, connection),
    disabled: connection.hasScopes === false
  }))

  return (
    <Form.Item
      name="connectionId"
      label={t('form.integrations.auth.account')}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-x-2">
          <span>{t('form.integrations.auth.accountShared')}</span>
          <Button.Link
            size="sm"
            onClick={() => window.location.assign(getIntegrationAuthorizeUrl(formId, app.id))}
          >
            {t('form.integrations.auth.connectAnother', { name: providerName })}
          </Button.Link>
        </div>
      }
      rules={[{ required: true }]}
    >
      <Select options={options} />
    </Form.Item>
  )
}

// The workspace's accounts couldn't be loaded, e.g. a network error
export function ConnectionsLoadFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="text-center text-sm">
      <p className="text-error">{t('form.integrations.auth.accountsFailed')}</p>
      <Button.Link size="sm" onClick={onRetry}>
        {t('components.error.retry')}
      </Button.Link>
    </div>
  )
}
