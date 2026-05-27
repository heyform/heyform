import { IconDots, IconLink } from '@tabler/icons-react'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getIntegrationDescription, getIntegrationSetting } from './utils'
import { IntegrationService } from '@/services'
import { useParam } from '@/utils'

import IconLogo from '@/assets/logo.svg?react'
import { Form, Image, Modal } from '@/components'
import { useAppStore, useFormStore, useModal } from '@/store'
import { IntegratedAppType } from '@/types'

import IntegrationSettingsItem from './IntegrationSettingsItem'

export interface IntegrationSettingsProps {
  app: IntegratedAppType
  onValuesChange?: (changedValues: Any, values: Any) => void
}

const SettingsForm: FC<IntegrationSettingsProps> = ({ app, onValuesChange }) => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { closeModal } = useAppStore()
  const { updateIntegration } = useFormStore()

  async function fetch(values: AnyMap) {
    await IntegrationService.updateSettings(formId, app.id, values)

    updateIntegration(app.id, {
      config: values
    })
    closeModal('IntegrationSettingsModal')
  }

  return (
    <Form.Simple
      className="space-y-4"
      initialValues={{
        ...app.integration?.config,
        fields: app.integration?.config?.fields || [[]]
      }}
      fetch={fetch}
      refreshDeps={[formId, app.id]}
      submitProps={{
        className: 'w-full !mt-0',
        label: t('form.integrations.connectWith', { name: app.name })
      }}
      submitOnChangedOnly
      onValuesChange={onValuesChange}
    >
      {app.settings?.map(setting => (
        <IntegrationSettingsItem
          key={setting.name}
          setting={getIntegrationSetting(t, app, setting)}
        />
      ))}
    </Form.Simple>
  )
}

const Settings: FC<{ app: IntegratedAppType }> = ({ app }) => {
  const { t } = useTranslation()
  const [hasIconError, setHasIconError] = useState(false)

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
        <SettingsForm app={app} />
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
