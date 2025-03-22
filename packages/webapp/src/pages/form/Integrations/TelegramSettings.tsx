import { Trans, useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function TelegramSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <IntegrationSettingsForm app={app}>
      <Form.Item
        name="chatId"
        label={t('form.integrations.telegram.label')}
        rules={[
          {
            required: true,
            message: t('form.integrations.telegram.required')
          }
        ]}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.telegram.footer"
            components={{
              a: (
                <a
                  className="text-primary underline"
                  href="https://t.me/HeyForm_bot"
                  target="_blank"
                  rel="noreferrer"
                />
              ),
              code: <code className="text-primary" />
            }}
          />
        }
      >
        <Input placeholder="-5123456789" />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
