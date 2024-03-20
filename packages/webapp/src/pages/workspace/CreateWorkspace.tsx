import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PhotoPickerField } from '@/components'
import { Button, Form, Input } from '@/components/ui'
import { WorkspaceModel } from '@/models'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useQuery, useRouter } from '@/utils'

const CreateWorkspace: FC = () => {
  const router = useRouter()
  const query = useQuery()
  const workspaceStore = useStore('workspaceStore')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { t } = useTranslation()

  async function handleFinish(values: WorkspaceModel) {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      const result = await WorkspaceService.create(values.name, values.avatar)

      if (helper.isValid(query.redirect_uri)) {
        return router.redirect(query.redirect_uri)
      }

      // Fetch the latest workspaces
      const workspaces = await WorkspaceService.workspaces()
      workspaceStore.setWorkspaces(workspaces)

      // Navigate to new created workspace page
      router.replace(`/workspace/${result}`)
    } catch (err: any) {
      setLoading(false)
      setError(err)
    }
  }

  return (
    <div>
      <div>
        <h2 className="mt-6 text-2xl font-bold text-slate-900">{t('setup.createW')}</h2>
        <p className="mt-2 text-base text-slate-500">{t('setup.explain')}</p>
      </div>

      <div className="mt-8">
        <div className="mt-6">
          <Form onFinish={handleFinish}>
            <Form.Item name="name" label={t('setup.name')} rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="avatar"
              label={
                <>
                  {t('setup.logo')}{' '}
                  <span className="text-slate-500">
                    ({t('workspace.createWorkspace.optional')})
                  </span>
                </>
              }
            >
              <PhotoPickerField />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading}>
              {t('setup.create')}
            </Button>

            {error && <div className="form-item-error">{error.message}</div>}
          </Form>
        </div>
      </div>
    </div>
  )
}

export default observer(CreateWorkspace)
