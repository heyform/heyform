import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'
import { WorkspaceService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

export default function AISettings() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { workspace, updateWorkspace } = useWorkspaceStore()

  const { run: updateAISettings } = useRequest(
    async (values: { aiKey?: string; aiModel?: string }) => {
      updateWorkspace(workspaceId, values)
      await WorkspaceService.update(workspaceId, values)
    },
    {
      manual: true,
      refreshDeps: [workspaceId]
    }
  )

  return (
    <section id="ai-settings" className="border-b border-accent-light pb-10">
      <h2 className="text-lg font-semibold">{t('settings.ai.title', 'OpenAI Configuration')}</h2>
      <p className="mt-1 text-sm text-secondary">
        {t(
          'settings.ai.description',
          'Configure your OpenAI API key to use with HeyForm. Leave blank to use the default provider.'
        )}
      </p>

      <div className="mt-4 space-y-8">
        <Form.Simple
          className="space-y-6 [&_[data-slot=control]]:space-y-0"
          initialValues={{
            aiKey: workspace?.aiKey || '',
            aiModel: workspace?.aiModel || 'gpt-4o'
          }}
          submitProps={{
            label: t('components.save', 'Save'),
            className: 'mt-6'
          }}
          onFinish={updateAISettings}
        >
          <Form.Item
            name="aiKey"
            label={t('settings.ai.apiKey', 'OpenAI API Key')}
            className="space-y-2"
          >
            <Input
              value={workspace?.aiKey}
              placeholder={t('settings.ai.apiKeyPlaceholder', 'Your OpenAI API key')}
              autoComplete="off"
              type="password"
            />
          </Form.Item>

          <Form.Item
            name="aiModel"
            label={t('settings.ai.model', 'OpenAI Model')}
            className="space-y-2"
          >
            <Input
              value={workspace?.aiModel}
              placeholder={t('settings.ai.modelPlaceholder', 'e.g., gpt-4o')}
              autoComplete="off"
              defaultValue="gpt-4o"
            />
          </Form.Item>
        </Form.Simple>
      </div>
    </section>
  )
}
