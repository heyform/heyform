import { IconDots, IconLink } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  getDefaultConnectionId,
  getIntegrationAuth,
  getIntegrationAuthorizeUrl,
  getIntegrationDefaultConfig,
  getIntegrationDescription,
  getIntegrationSetting,
  isSettingVisible,
  needsAccountConnection,
  startsOnNewAccount
} from './utils'
import { FormService, IntegrationService } from '@/services'
import { useParam } from '@/utils'

import IconLogo from '@/assets/logo.svg?react'
import { Button, Form, Image, Modal } from '@/components'
import { INTEGRATION_CONNECTION_STATUS_ENUM, INTEGRATION_STATUS_ENUM } from '@/consts'
import { useAppStore, useFormStore, useModal } from '@/store'
import { IntegratedAppType, IntegrationConnectionType } from '@/types'

import {
  ApiKeyItem,
  ConnectAccount,
  ConnectionItem,
  ConnectionsLoadFailed
} from './IntegrationAuthItem'
import IntegrationRecords from './IntegrationRecords'
import IntegrationSettingsItem, { VisibleSetting } from './IntegrationSettingsItem'

export interface IntegrationSettingsProps {
  app: IntegratedAppType
  // The workspace's accounts, for oauth2 apps
  connections?: IntegrationConnectionType[]
  onValuesChange?: (changedValues: Any, values: Any) => void
}

export const SettingsForm: FC<IntegrationSettingsProps> = ({
  app,
  connections = [],
  onValuesChange
}) => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { closeModal } = useAppStore()
  const { updateIntegration, setIntegrations } = useFormStore()

  async function fetch({ apiKey, connectionId, ...values }: AnyMap) {
    // Only visible settings, as the server stores
    const config = Object.fromEntries(
      Object.entries(values).filter(([name]) => {
        const setting = app.settings?.find(row => row.name === name)
        return !setting || isSettingVisible(setting, values)
      })
    )

    // The config as the server stored it: the app may have normalised it,
    // e.g. created a spreadsheet, which saving again mustn't repeat
    const storedConfig: AnyMap = await IntegrationService.updateSettings(
      formId,
      app.id,
      config,
      apiKey || undefined,
      connectionId || undefined
    )

    const connection = connections.find(row => row.id === connectionId)
    // Saving activates the integration, as on the server, unless its
    // account (or key) still needs reconnecting
    const needsReconnect =
      app.auth?.type === 'oauth2'
        ? connection?.status === INTEGRATION_CONNECTION_STATUS_ENUM.NEEDS_RECONNECT
        : app.integration?.status === INTEGRATION_STATUS_ENUM.NEEDS_RECONNECT

    updateIntegration(app.id, {
      config: storedConfig ?? config,
      status: needsReconnect
        ? INTEGRATION_STATUS_ENUM.NEEDS_RECONNECT
        : INTEGRATION_STATUS_ENUM.ACTIVE,
      ...(connectionId ? { connectionId, connected: true } : {})
    })

    // Pick up the masked hint of a new key, the status it restores, and
    // what's still waiting once the server has resent the rest. The save has
    // already succeeded, so a failed reload doesn't keep the modal open.
    if (apiKey || app.integration?.waitingCount) {
      try {
        setIntegrations(await FormService.integrations(formId))
      } catch (err) {
        console.error(err)
      }
    }

    closeModal('IntegrationSettingsModal')
  }

  // Starts on an account, so the picker is never blank
  const connectionId = getDefaultConnectionId(app, connections)

  return (
    <Form.Simple
      className="space-y-4"
      initialValues={{
        ...getIntegrationDefaultConfig(app),
        ...app.integration?.config,
        fields: app.integration?.config?.fields || [[]],
        connectionId
      }}
      fetch={fetch}
      refreshDeps={[formId, app.id]}
      submitProps={{
        className: 'w-full !mt-0',
        label: t('form.integrations.connectWith', { name: app.name })
      }}
      // An account picked for the integration is itself a change to save
      submitOnChangedOnly={!startsOnNewAccount(app, connectionId)}
      onValuesChange={onValuesChange}
    >
      {app.auth?.type === 'apiKey' && <ApiKeyItem app={app} />}

      {app.auth?.type === 'oauth2' && (
        <ConnectionItem app={app} formId={formId} connections={connections} />
      )}

      {app.settings?.map(setting => (
        <VisibleSetting key={setting.name} setting={setting}>
          <IntegrationSettingsItem
            formId={formId}
            appId={app.id}
            setting={getIntegrationSetting(t, app, setting)}
          />
        </VisibleSetting>
      ))}
    </Form.Simple>
  )
}

const Settings: FC<{ app: IntegratedAppType }> = ({ app }) => {
  const { t } = useTranslation()
  const { formId } = useParam()
  const [hasIconError, setHasIconError] = useState(false)
  const { providerName } = getIntegrationAuth(t, app)
  const isOAuth2 = app.auth?.type === 'oauth2'

  // Any account the workspace has connected can be picked
  const {
    data: connections,
    error: connectionsError,
    loading: connectionsLoading,
    refresh: refreshConnections
  } = useRequest(
    async (): Promise<IntegrationConnectionType[]> =>
      isOAuth2 ? IntegrationService.connections(formId, app.id) : [],
    { refreshDeps: [formId, app.id] }
  )

  return (
    <div>
      <div className="pt-6">
        <div className="flex items-center justify-center gap-x-4">
          <div className="border-accent-light h-12 w-12 rounded-lg border p-1.5">
            <IconLogo className="h-full w-full" />
          </div>

          <IconDots className="text-input h-6 w-6" />

          <div className="after:border-accent-light relative h-12 w-12 p-1 after:absolute after:inset-0 after:rounded-lg after:border">
            {!hasIconError && !!app.icon ? (
              <Image
                className="h-full w-full rounded-lg object-cover"
                src={app.icon}
                onError={() => setHasIconError(true)}
              />
            ) : (
              <div className="bg-accent-light text-secondary flex h-full w-full items-center justify-center rounded-lg">
                <IconLink className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        <h2 className="mt-6 text-center text-lg/6 font-semibold">
          {t('form.integrations.connectWith', { name: app.name })}
        </h2>
        <p className="text-secondary mt-2 px-10 text-center text-sm">
          {getIntegrationDescription(t, app)}
        </p>
      </div>

      <div className="mt-12">
        {isOAuth2 && !connections ? (
          connectionsError && !connectionsLoading ? (
            <ConnectionsLoadFailed onRetry={refreshConnections} />
          ) : null
        ) : needsAccountConnection(app, connections) ? (
          <ConnectAccount app={app} formId={formId} />
        ) : (
          <>
            {app.integration?.status === INTEGRATION_STATUS_ENUM.NEEDS_RECONNECT && isOAuth2 && (
              <div className="mb-6 text-center text-sm">
                <p className="text-error">
                  {t('form.integrations.auth.needsReconnect', { name: providerName })}
                </p>
                <Button.Link
                  size="sm"
                  onClick={() => window.location.assign(getIntegrationAuthorizeUrl(formId, app.id))}
                >
                  {t('form.integrations.auth.reconnectAccount', { name: providerName })}
                </Button.Link>
              </div>
            )}

            <SettingsForm app={app} connections={connections} />
          </>
        )}

        {app.integration && (
          <IntegrationRecords
            formId={formId}
            appId={app.id}
            waitingCount={app.integration.waitingCount}
          />
        )}
      </div>
    </div>
  )
}

export default function IntegrationSettingsModal() {
  const { isOpen, payload, onOpenChange } = useModal('IntegrationSettingsModal')

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className: 'max-w-2xl',
        forceMount: true
      }}
      onOpenChange={onOpenChange}
    >
      {payload?.app && <Settings app={payload.app} />}
    </Modal>
  )
}
