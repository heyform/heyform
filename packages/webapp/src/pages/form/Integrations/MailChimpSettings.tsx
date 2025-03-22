import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function MailChimpSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const { formFields } = useFormStore()

  async function fetchAudiences() {
    return await IntegrationService.mailchimpAudiences(formId, app?.id as string)
  }

  async function handleOAuth(code: string) {
    const result = await IntegrationService.mailchimpOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app}>
      {/* Audience */}
      <Form.Item
        name="audience"
        label={t('form.integrations.mailChimp.audience.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="w-full"
          returnOptionAsValue
          options={
            app.integration?.attributes?.audience
              ? [app.integration.attributes.audience]
              : undefined
          }
          fetch={fetchAudiences}
          refreshDeps={[isAuthorized]}
          placeholder={t('form.integrations.mailChimp.audience.placeholder')}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>

      {/* Email address */}
      <Form.Item
        name="email"
        label={t('form.integrations.mailChimp.subscriberEmail.headline')}
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

      {/* Full name */}
      <Form.Item
        name="fullName"
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

      {/* Address */}
      <Form.Item
        name="address"
        label={t('form.integrations.mailChimp.address.headline')}
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
      <Form.Item name="phoneNumber" label={t('form.integrations.osticket.phoneNumber.headline')}>
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
