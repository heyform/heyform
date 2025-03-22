import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function SlackSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)

  async function fetchChannels() {
    return IntegrationService.slackChannels(formId, app?.id as string)
  }

  async function handleOAuth(code: string) {
    const result = await IntegrationService.slackOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app}>
      {/* Channel */}
      <Form.Item
        name="channel"
        label={t('form.integrations.slack.channel.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          refreshDeps={[isAuthorized]}
          options={
            app.integration?.attributes?.channel ? [app.integration.attributes.channel] : undefined
          }
          fetch={fetchChannels}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
