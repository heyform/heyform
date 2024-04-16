import { observer } from 'mobx-react-lite'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PhotoPickerField, WorkspaceIcon } from '@/components'
import { Form, Input } from '@/components/ui'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

const LogoUploader: FC = observer(() => {
  const { workspaceId } = useParam()
  const workspaceStore = useStore('workspaceStore')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { t } = useTranslation()

  async function handleChange(avatar: string) {
    setLoading(true)
    setError(null)

    try {
      await WorkspaceService.update({
        teamId: workspaceId,
        avatar
      })

      workspaceStore.updateWorkspace(workspaceId, {
        avatar
      })
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  return (
    <div>
      <PhotoPickerField
        value={workspaceStore.workspace?.avatar}
        label={t('workspace.settings.logo')}
        description={t('workspace.settings.pickLogo')}
        defaultIcon={<WorkspaceIcon />}
        changeLoading={loading}
        onChange={handleChange}
      />

      {error && <div className="form-item-error">{error.message}</div>}
    </div>
  )
})

export const Branding: FC = observer(() => {
  const { workspaceId } = useParam()
  const { t } = useTranslation()
  const workspaceStore = useStore('workspaceStore')

  async function handleFinish(values: IMapType) {
    await WorkspaceService.update({
      teamId: workspaceId,
      name: values.name
    })

    workspaceStore.updateWorkspace(workspaceId, {
      name: values.name
    })
  }

  return (
    <>
      <LogoUploader />

      <div>
        <Form.Custom
          inline
          initialValues={{
            name: workspaceStore.workspace?.name
          }}
          submitText={t('workspace.settings.up')}
          submitOptions={{
            className: 'mt-6 ml-3'
          }}
          onlySubmitOnValueChange={true}
          request={handleFinish}
        >
          <Form.Item name="name" label={t('workspace.settings.nameW')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form.Custom>
      </div>
    </>
  )
})
