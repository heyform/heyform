import { IconExclamationCircle } from '@tabler/icons-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Form, Input } from '@/components'
import { useParam } from '@/utils'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function EmailSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()
  const { workspaceId, projectId, formId } = useParam()

  return (
    <IntegrationSettingsForm app={app}>
      <div className="flex items-center justify-center gap-x-2 rounded-lg border border-accent-light bg-red-50 py-2">
        <IconExclamationCircle className="h-5 w-5 text-red-700" />
        <span className="text-sm/6 font-medium text-red-700">
          <Trans
            t={t}
            i18nKey="form.integrations.email.deprecation"
            components={{
              a: (
                <Link
                  className="underline"
                  to={`/workspace/${workspaceId}/project/${projectId}/form/${formId}/settings#emailNotification`}
                />
              )
            }}
          />
        </span>
      </div>

      <Form.Item
        name="email"
        label={t('form.integrations.email.label')}
        rules={[
          {
            type: 'email',
            message: t('form.integrations.email.invalid')
          }
        ]}
      >
        <Input placeholder="jack@example.com" />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
