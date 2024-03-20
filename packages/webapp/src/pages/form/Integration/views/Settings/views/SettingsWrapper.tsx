import { FC, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form } from '@/components/ui'
import { AppModel } from '@/models'
import { AppService, FormService, IntegrationService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

import { Summary } from './Summary'

interface Option {
  name: string
  label: string
  placeholder?: string
  description?: ReactNode
  rules: any[]
}

export interface SettingsProps {
  app?: AppModel
  options?: Option[]
  onRequest?: (loading: boolean) => void
  onFinish?: () => void
}

interface SettingsWrapperProps extends SettingsProps {
  initialValues?: Record<string, any>
  onValuesChange?: (changedValues: any, values: Record<string, any>) => void
  children?: ReactNode
}

export const SettingsWrapper: FC<SettingsWrapperProps> = ({
  app,
  initialValues,
  onValuesChange,
  onRequest,
  onFinish,
  children = []
}) => {
  const { t } = useTranslation()
  const { formId } = useParam()
  const integrationStore = useStore('integrationStore')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>()

  async function handleFinish(values: Record<string, any>) {
    if (loading) {
      return
    }

    setLoading(true)
    onRequest?.(true)

    try {
      await IntegrationService.updateSettings(formId, app!.id, {
        [app!.uniqueId]: values
      })
      await fetchIntegrations()
      onFinish && onFinish()
    } catch (err: any) {
      setError(err)
      setLoading(false)
    }

    onRequest?.(false)
  }

  async function fetchIntegrations() {
    const [result1, result2] = await Promise.all([
      AppService.apps(),
      FormService.integrations(formId)
    ])

    integrationStore.setApps(result1)
    integrationStore.setIntegrations(result2)

    return true
  }

  return (
    <div className="settings-wrapper-container">
      <Summary app={app} />
      <Form initialValues={initialValues} onValuesChange={onValuesChange} onFinish={handleFinish}>
        {children}
        {error && <div className="form-item-error">{error.message}</div>}
        <Button htmlType="submit" type="primary" block={true} loading={loading}>
          {t('integration.ConnectWith')} {app?.name}
        </Button>
      </Form>
    </div>
  )
}
