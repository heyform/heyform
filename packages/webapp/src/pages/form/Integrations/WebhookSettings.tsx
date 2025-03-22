import { useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function WebhookSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <IntegrationSettingsForm app={app}>
      <Form.Item
        name="webhook"
        label={t('form.integrations.webhook.label')}
        rules={[
          {
            type: 'url',
            message: t('form.integrations.webhook.invalid')
          }
        ]}
      >
        <Input placeholder="https://webhook.example.com" />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
