import { Trans, useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'

import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function LarkSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <IntegrationSettingsForm app={app}>
      <Form.Item
        name="webhook"
        label={t('form.integrations.lark.label')}
        rules={[
          {
            type: 'url',
            message: t('form.integrations.lark.invalid')
          }
        ]}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.lark.footer"
            components={{
              a: (
                <a
                  className="text-primary underline"
                  href="https://www.larksuite.com/hc/en-US/articles/360048487736-add-bots-to-groups#tabs0|lineguid-BvpKV"
                  target="_blank"
                  rel="noreferrer"
                />
              )
            }}
          />
        }
      >
        <Input placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx" />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
