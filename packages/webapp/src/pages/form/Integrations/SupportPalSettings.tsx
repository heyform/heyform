import { helper } from '@heyform-inc/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function SupportPalSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { formFields } = useFormStore()

  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const [systemURL, setSystemURL] = useState<string | null>()
  const [token, setToken] = useState<string | null>()
  const [departmentId, setDepartmentId] = useState<number | null>()

  async function fetchDepartments() {
    if (!isAuthorized) {
      return []
    }

    return await IntegrationService.supportPalDepartments(formId, systemURL!, token!)
  }

  async function fetchPriorities() {
    if (!isAuthorized) {
      return []
    }

    return await IntegrationService.supportPalPriorities(formId, systemURL!, token!, departmentId!)
  }

  async function fetchStatus() {
    if (!isAuthorized) {
      return []
    }

    return await IntegrationService.supportPalStatus(formId, systemURL!, token!)
  }

  function handleValuesChange(changed: AnyMap, values: AnyMap) {
    if (changed.systemURL) {
      setSystemURL(changed.systemURL)
    } else if (changed.token) {
      setToken(changed.token)
    } else if (changed.department) {
      setDepartmentId(changed.department.id)
    }

    setAuthorized(helper.isValid(values.systemURL) && helper.isValid(values.token))
  }

  return (
    <IntegrationSettingsForm app={app} onValuesChange={handleValuesChange}>
      {/* System URL */}
      <Form.Item
        name="systemURL"
        label={t('form.integrations.supportPal.systemURL.headline')}
        rules={[
          {
            type: 'url'
          }
        ]}
      >
        <Input />
      </Form.Item>

      {/* Token */}
      <Form.Item
        name="token"
        label={t('form.integrations.supportPal.token.headline')}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      {/* User name */}
      <Form.Item
        name="userName"
        label={t('form.integrations.supportPal.userName.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="h-11 w-full sm:h-10"
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
        label={t('form.integrations.supportPal.email.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="h-11 w-full sm:h-10"
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
        label={t('form.integrations.supportPal.subject.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="h-11 w-full sm:h-10"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>

      {/* Text */}
      <Form.Item
        name="text"
        label={t('form.integrations.supportPal.text.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="h-11 w-full sm:h-10"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>

      {/* Select department */}
      <Form.Item
        name="department"
        label={t('form.integrations.supportPal.department.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          refreshDeps={[isAuthorized]}
          returnOptionAsValue
          fetch={fetchDepartments}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>

      {/* Select priority */}
      <Form.Item
        name="priority"
        label={t('form.integrations.supportPal.priority.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          refreshDeps={[isAuthorized, departmentId]}
          returnOptionAsValue
          fetch={fetchPriorities}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>

      {/* Select status */}
      <Form.Item
        name="status"
        label={t('form.integrations.supportPal.status.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          refreshDeps={[isAuthorized]}
          returnOptionAsValue
          fetch={fetchStatus}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
