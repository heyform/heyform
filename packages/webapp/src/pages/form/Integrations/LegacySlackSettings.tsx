import { IconAlertCircle } from '@tabler/icons-react'
import { Trans, useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function LegacySlackSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <IntegrationSettingsForm app={app}>
      <div className="-mt-6 mb-6 flex items-center gap-x-2 rounded-lg border border-error px-4 py-3 text-error">
        <IconAlertCircle className="h-5 w-5" />
        <p className="text-sm/6">
          Migrate to the new Slack integration before it is deprecated in the next version.
        </p>
      </div>

      <Form.Item
        name="webhook"
        label={t('form.integrations.legacyslack.label')}
        rules={[
          {
            type: 'url',
            message: t('form.integrations.legacyslack.invalid')
          }
        ]}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.legacyslack.footer"
            components={{
              a1: (
                <a
                  className="text-primary underline"
                  href="https://api.slack.com/apps/new"
                  target="_blank"
                  rel="noreferrer"
                />
              ),
              a2: (
                <a
                  className="text-primary underline"
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noreferrer"
                />
              )
            }}
          />
        }
      >
        <Input placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX" />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
