import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function DropboxSetting({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)

  async function fetchFolders() {
    return await IntegrationService.dropboxFolders(formId, app?.id as string)
  }

  async function handleOAuth(code: string) {
    const result = await IntegrationService.googleOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app}>
      {/* Select folder */}
      <Form.Item
        name="folder"
        label={t('form.integrations.googledrive.folder.headline')}
        footer={t('form.integrations.googledrive.folder.footer')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          fetch={fetchFolders}
          refreshDeps={[isAuthorized]}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
