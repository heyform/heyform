import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Form } from '@/components'
import { APP_STATUS_ENUM } from '@/consts'
import { IntegrationService } from '@/services'
import { useAppStore, useFormStore } from '@/store'
import { IntegratedAppType } from '@/types'
import { useParam } from '@/utils'

export interface IntegrationSettingsFormProps extends ComponentProps {
  app: IntegratedAppType
  onValuesChange?: (changedValues: any, values: any) => void
}

const IntegrationSettingsForm: FC<IntegrationSettingsFormProps> = ({
  app,
  children,
  onValuesChange
}) => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { closeModal } = useAppStore()
  const { updateIntegration } = useFormStore()

  async function fetch(values: AnyMap) {
    await IntegrationService.updateSettings(formId, app.id, {
      [app.uniqueId]: values
    })

    updateIntegration(app.id, {
      ...app.integration,
      attributes: {
        ...app.integration?.attributes,
        ...values
      },
      status: app.integration?.status ?? APP_STATUS_ENUM.ACTIVE
    })
    closeModal('IntegrationSettingsModal')
  }

  return (
    <Form.Simple
      className="space-y-4"
      initialValues={{
        ...app.integration?.attributes,
        fields: app.integration?.attributes?.fields || [[]]
      }}
      fetch={fetch}
      refreshDeps={[formId, app.id, app.uniqueId]}
      submitProps={{
        className: 'w-full !mt-0',
        label: t('form.integrations.connectWith', { name: app.name })
      }}
      submitOnChangedOnly
      onValuesChange={onValuesChange}
    >
      {children}
    </Form.Simple>
  )
}

export default IntegrationSettingsForm
