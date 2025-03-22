import { helper } from '@heyform-inc/utils'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Image, Switch, Tooltip } from '@/components'
import { APP_STATUS_ENUM, INTEGRATION_STATUS_ENUM } from '@/consts'
import { IntegrationService } from '@/services'
import { useAppStore, useFormStore } from '@/store'
import { IntegratedAppType } from '@/types'
import { useParam } from '@/utils'

interface IntegrationItemProps {
  app: IntegratedAppType
}

const IntegrationItem: FC<IntegrationItemProps> = ({ app }) => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { openModal } = useAppStore()
  const { updateIntegration, deleteIntegration } = useFormStore()

  const active = useMemo(
    () =>
      helper.isValid(app.integration?.attributes) &&
      app.integration?.status === INTEGRATION_STATUS_ENUM.ACTIVE,
    [app.integration?.attributes, app.integration?.status]
  )

  const { loading: toggleLoading, run: toggleRun } = useRequest(
    async (checked: boolean) => {
      const status = checked ? INTEGRATION_STATUS_ENUM.ACTIVE : INTEGRATION_STATUS_ENUM.DISABLED

      await IntegrationService.updateStatus(formId, app.id, status)
      updateIntegration(app.id, { status })
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

  function handleOpenLink() {
    window.open(app.homepage, '_blank')
  }

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

  const children = useMemo(() => {
    switch (app.status) {
      case APP_STATUS_ENUM.REDIRECT_TO_EXTERNAL:
        return (
          <Button size="sm" onClick={handleOpenLink}>
            {t('form.integrations.connect')}
          </Button>
        )

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
  }, [app.status, handleConnect, handleOpenLink, t, deleteLoading])

  // Migrate to the new Slack integration before it is deprecated in the next version.
  if (app.uniqueId === 'legacyslack' && !app.isAuthorized) {
    return null
  }

  return (
    <li className="cursor-default rounded-lg border border-input px-4 py-6 text-sm">
      <div className="flex items-center justify-between">
        <Image className="h-8 w-8 rounded-lg border border-accent-light" src={app.avatar} />
        {children}
      </div>
      <div className="mt-2 font-medium">{app.name}</div>
      <div className="mt-1 text-secondary">{app.description}</div>
    </li>
  )
}

export default IntegrationItem
