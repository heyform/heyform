import { Trans, useTranslation } from 'react-i18next'

import { Form, Input, Select } from '@/components'
import { useFormStore } from '@/store'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function OsticketSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()
  const { formFields } = useFormStore()

  return (
    <IntegrationSettingsForm app={app}>
      {/* Server URL */}
      <Form.Item
        name="serverURL"
        label={t('form.integrations.osticket.serverURL.headline')}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.osticket.serverURL.footer"
            components={{
              span: <span className="text-primary" />
            }}
          />
        }
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      {/* API key */}
      <Form.Item
        name="apiKey"
        label={t('form.integrations.osticket.apiKey.headline')}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.osticket.apiKey.footer"
            components={{
              a: (
                <a
                  className="text-primary underline"
                  href="https://docs.osticket.com/en/latest/Developer%20Documentation/API%20Docs.html"
                  target="_blank"
                  rel="noreferrer"
                />
              )
            }}
          />
        }
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      {/* Username */}
      <Form.Item
        name="name"
        label={t('form.integrations.osticket.userName.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="w-full"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>

      {/* Email address */}
      <Form.Item
        name="email"
        label={t('form.integrations.osticket.emailAddress.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="w-full"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>

      {/* Phone number */}
      <Form.Item name="phone" label={t('form.integrations.osticket.phoneNumber.headline')}>
        <Select
          className="w-full"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>

      {/* Subject */}
      <Form.Item
        name="subject"
        label={t('form.integrations.osticket.subject.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="w-full"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>

      {/* Message */}
      <Form.Item
        name="message"
        label={t('form.integrations.osticket.message.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="w-full"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
