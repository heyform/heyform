import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function HubSpotSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const { formFields } = useFormStore()

  async function handleOAuth(code: string) {
    const result = await IntegrationService.hubspotOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app}>
      {/* Full name */}
      <Form.Item
        name="fullname"
        label={t('form.integrations.hubspot.fullName.headline')}
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

      {/* Job title */}
      <Form.Item name="jobtitle" label={t('form.integrations.hubspot.jobTitle.headline')}>
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
