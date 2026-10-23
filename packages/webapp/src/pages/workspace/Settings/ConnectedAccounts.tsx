import { useRequest } from 'ahooks'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { WorkspaceService } from '@/services'
import { useParam } from '@/utils'

import { Badge, Button, useAlert } from '@/components'
import { INTEGRATION_CONNECTION_STATUS_ENUM } from '@/consts'
import { IntegrationConnectionType } from '@/types'

export const ConnectedAccountList: FC<{
  connections: IntegrationConnectionType[]
  onDisconnect?: (connection: IntegrationConnectionType) => void
}> = ({ connections, onDisconnect }) => {
  const { t } = useTranslation()

  if (!connections.length) {
    return (
      <p className="text-secondary mt-4 text-base/5 sm:text-sm/5">
        {t('settings.connectedAccounts.empty')}
      </p>
    )
  }

  return (
    <ul className="divide-accent-light mt-4 divide-y">
      {connections.map(connection => {
        const needsReconnect =
          connection.status === INTEGRATION_CONNECTION_STATUS_ENUM.NEEDS_RECONNECT
        const forms = connection.forms || []

        return (
          <li
            key={connection.id}
            className="flex items-start justify-between gap-6 py-4"
            data-status={connection.status}
          >
            <div className="min-w-0 flex-1 text-base/5 sm:text-sm/5">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="font-medium">{connection.providerName}</span>
                <span className="truncate">
                  {connection.accountEmail || connection.accountName}
                </span>
                <Badge color={needsReconnect ? 'red' : 'green'}>
                  {t(
                    needsReconnect
                      ? 'settings.connectedAccounts.needsReconnect'
                      : 'settings.connectedAccounts.active'
                  )}
                </Badge>
              </div>
              {connection.connectedBy && (
                <div className="text-secondary mt-1">
                  {t('settings.connectedAccounts.connectedBy', { name: connection.connectedBy })}
                </div>
              )}
              <div className="text-secondary mt-1 break-words">
                {forms.length
                  ? t('settings.connectedAccounts.forms', {
                      count: forms.length,
                      names: forms.map(form => form.name).join(', ')
                    })
                  : t('settings.connectedAccounts.unused')}
              </div>
            </div>

            {connection.canDisconnect && onDisconnect && (
              <Button.Ghost size="sm" onClick={() => onDisconnect(connection)}>
                {t('settings.connectedAccounts.disconnect')}
              </Button.Ghost>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Accounts connected for integrations, shared by the whole workspace
export default function WorkspaceConnectedAccounts() {
  const { t } = useTranslation()
  const alert = useAlert()
  const { workspaceId } = useParam()

  const { data, refresh } = useRequest(
    async (): Promise<IntegrationConnectionType[]> =>
      WorkspaceService.integrationConnections(workspaceId),
    { refreshDeps: [workspaceId] }
  )

  function handleDisconnect(connection: IntegrationConnectionType) {
    alert({
      title: t('settings.connectedAccounts.disconnectHeadline', {
        account: connection.accountEmail || connection.accountName
      }),
      description: t('settings.connectedAccounts.disconnectDescription', {
        provider: connection.providerName
      }),
      cancelProps: {
        label: t('components.cancel')
      },
      confirmProps: {
        label: t('settings.connectedAccounts.disconnect'),
        className: 'bg-error hover:bg-error text-primary-light dark:text-primary'
      },
      fetch: async () => {
        await WorkspaceService.disconnectIntegrationConnection(workspaceId, connection.id)
        refresh()
      }
    })
  }

  return (
    <section id="connected-accounts" className="border-accent-light border-b py-10">
      <h2 className="hf-section-title">{t('settings.connectedAccounts.title')}</h2>
      <p data-slot="text" className="text-secondary mt-1 text-base/5 sm:text-sm/5">
        {t('settings.connectedAccounts.description')}
      </p>

      {data && <ConnectedAccountList connections={data} onDisconnect={handleDisconnect} />}
    </section>
  )
}
