import { Trans, useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function FacebookPixelSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <IntegrationSettingsForm app={app}>
      <Form.Item
        name="trackingCode"
        label={t('form.integrations.facebookpixel.label')}
        rules={[
          {
            required: true,
            message: t('form.integrations.facebookpixel.required')
          }
        ]}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.facebookpixel.footer"
            components={{
              a: (
                <a
                  className="text-primary underline"
                  href="https://www.facebook.com/business/help/952192354843755?id=1205376682832142"
                  target="_blank"
                  rel="noreferrer"
                />
              )
            }}
          />
        }
      >
        <Input placeholder={t('form.integrations.facebookpixel.placeholder')} />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
