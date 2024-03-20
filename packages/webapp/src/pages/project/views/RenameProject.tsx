import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Modal } from '@/components/ui'
import type { ProjectModel } from '@/models'
import { ProjectService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

interface RenameProjectProps extends IModalProps {
  project?: ProjectModel | null
}

export const RenameProject: FC<RenameProjectProps> = ({ visible, project, onClose }) => {
  const { workspaceId } = useParam()
  const workspaceStore = useStore('workspaceStore')
  const { t } = useTranslation()

  async function handleUpdate(values: any) {
    await ProjectService.rename(project!.id, values.name)
    workspaceStore.updateProject(workspaceId, project!.id, values)

    onClose?.()
  }

  return (
    <Modal contentClassName="max-w-md" visible={visible} onClose={onClose} showCloseIcon>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">{t('project.renameP')}</h1>
        </div>

        <Form.Custom
          initialValues={{
            name: project?.name
          }}
          submitText={t('project.update')}
          submitOptions={{
            type: 'primary'
          }}
          onlySubmitOnValueChange={true}
          request={handleUpdate}
        >
          <Form.Item name="name" label={t('project.projectName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
}
