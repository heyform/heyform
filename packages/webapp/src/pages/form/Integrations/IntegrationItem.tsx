import { IconLink, IconPencil, IconTrash } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getIntegrationAuth, getIntegrationDescription } from './utils'
import { FormService, IntegrationService } from '@/services'
import { useParam } from '@/utils'
import { helper } from '@heyform-inc/utils'

import { Button, Image, Switch, Tooltip } from '@/components'
import { APP_STATUS_ENUM, INTEGRATION_STATUS_ENUM } from '@/consts'
import { useAppStore, useFormStore } from '@/store'
import { IntegratedAppType } from '@/types'

import { IntegrationWaitingCount } from './IntegrationRecords'

interface IntegrationItemProps {
  app: IntegratedAppType
}

const IntegrationItem: FC<IntegrationItemProps> = ({ app }) => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { openModal } = useAppStore()
  const { updateIntegration, deleteIntegration, setIntegrations } = useFormStore()
  const [hasIconError, setHasIconError] = useState(false)

  const active = useMemo(
    () =>
      helper.isValid(app.integration?.config) &&
      app.integration?.status === INTEGRATION_STATUS_ENUM.ACTIVE,
    [app.integration?.config, app.integration?.status]
  )

  const { loading: toggleLoading, run: toggleRun } = useRequest(
    async (checked: boolean) => {
      const status = checked ? INTEGRATION_STATUS_ENUM.ACTIVE : INTEGRATION_STATUS_ENUM.DISABLED

      await IntegrationService.updateStatus(formId, app.id, status)
      updateIntegration(app.id, { status })

      // Turning it on sends what was waiting; the server says what's left
      if (checked && app.integration?.waitingCount) {
        setIntegrations(await FormService.integrations(formId))
      }
    },
    {
      manual: true,
      refreshDeps: [formId, app.id]
    }
  )

  const { loading: deleteLoading, run: deleteRun } = useRequest(
    async () => {
      await IntegrationService.deleteSettings(formId, app.id)
      deleteIntegration(app.id)
    },
    {
      manual: true,
      refreshDeps: [formId, app.id]
    }
  )

  function handleConnect() {
    openModal('IntegrationSettingsModal', { app })
  }

  function handleEdit() {
    openModal('IntegrationSettingsModal', {
      app: {
        ...app,
        isAuthorized: true
      }
    })
  }

  const needsReconnect = app.integration?.status === INTEGRATION_STATUS_ENUM.NEEDS_RECONNECT

  const children = useMemo(() => {
    if (needsReconnect) {
      return (
        <div className="flex items-center gap-x-1">
          <Button size="sm" onClick={handleConnect}>
            {t('form.integrations.auth.reconnect')}
          </Button>

          <Tooltip label={t('components.delete')}>
            <Button.Link size="sm" loading={deleteLoading} iconOnly onClick={deleteRun}>
              <IconTrash className="h-5 w-5" />
            </Button.Link>
          </Tooltip>
        </div>
      )
    }

    switch (app.status) {
      case APP_STATUS_ENUM.ACTIVE:
        return (
          <div className="flex items-center gap-x-1">
            <Switch value={active} loading={toggleLoading} onChange={toggleRun} />

            <Tooltip label={t('components.edit')}>
              <Button.Link size="sm" iconOnly onClick={handleEdit}>
                <IconPencil className="h-5 w-5" />
              </Button.Link>
            </Tooltip>

            <Tooltip label={t('components.delete')}>
              <Button.Link size="sm" loading={deleteLoading} iconOnly onClick={deleteRun}>
                <IconTrash className="h-5 w-5" />
              </Button.Link>
            </Tooltip>
          </div>
        )

      case APP_STATUS_ENUM.PENDING:
        return (
          <Button size="sm" onClick={handleConnect}>
            {t('form.integrations.connect')}
          </Button>
        )
    }
  }, [handleConnect, t, deleteLoading, needsReconnect])

  return (
    <li className="hf-card border-input cursor-default rounded-lg border px-6 py-6 text-sm">
      <div className="flex items-center justify-between">
        {!hasIconError && helper.isValid(app.icon) ? (
          <Image
            className="border-accent-light h-8 w-8 rounded-lg border"
            src={app.icon}
            onError={() => setHasIconError(true)}
          />
        ) : (
          <div className="border-accent-light bg-accent-light text-secondary flex h-8 w-8 items-center justify-center rounded-lg border">
            <IconLink className="h-4 w-4" />
          </div>
        )}
        {children}
      </div>
      <div className="mt-2 font-medium">{app.name}</div>
      <div className="text-secondary mt-1">{getIntegrationDescription(t, app)}</div>
      {needsReconnect && (
        <div className="text-error mt-2">
          {t('form.integrations.auth.needsReconnect', {
            name: getIntegrationAuth(t, app).providerName
          })}
        </div>
      )}
      <IntegrationWaitingCount count={app.integration?.waitingCount} />
    </li>
  )
}

export default IntegrationItem
