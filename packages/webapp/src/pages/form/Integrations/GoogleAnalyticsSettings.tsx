import { Trans, useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function GoogleAnalyticsSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <IntegrationSettingsForm app={app}>
      <Form.Item
        name="trackingCode"
        label={t('form.integrations.googleanalytics.label')}
        rules={[
          {
            required: true,
            message: t('form.integrations.googleanalytics.required')
          }
        ]}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.googleanalytics.footer"
            components={{
              a: (
                <a
                  className="text-primary underline"
                  href="https://support.google.com/analytics/answer/1008080?hl=en#zippy=%2Cin-this-article"
                  target="_blank"
                  rel="noreferrer"
                />
              )
            }}
          />
        }
      >
        <Input placeholder={t('form.integrations.googleanalytics.placeholder')} />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
