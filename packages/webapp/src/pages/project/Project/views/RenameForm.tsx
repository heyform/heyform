import { FormModel } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Modal } from '@/components/ui'
import { FormService } from '@/service'
import { useStore } from '@/store'

interface RenameFormProps extends IModalProps {
  form?: FormModel | null
}

export const RenameForm: FC<RenameFormProps> = ({ visible, form, onClose }) => {
  const workspaceStore = useStore('workspaceStore')
  const { t } = useTranslation()

  async function handleUpdate(values: any) {
    await FormService.update(form!.id, values)
    workspaceStore.updateForm(form!.projectId, form!.id, values)
    onClose?.()
  }

  return (
    <Modal contentClassName="max-w-md" visible={visible} onClose={onClose} showCloseIcon>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('project.renameForm')}
          </h1>
        </div>

        <Form.Custom
          initialValues={{
            name: form?.name
          }}
          submitText={t('project.update')}
          submitOptions={{
            type: 'primary'
          }}
          onlySubmitOnValueChange={true}
          request={handleUpdate}
        >
          <Form.Item name="name" label={t('project.formName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
}
