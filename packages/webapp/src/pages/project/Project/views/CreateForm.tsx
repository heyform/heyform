import { FormKindEnum, InteractiveModeEnum } from '@heyform-inc/shared-types-enums'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Form, Input, Modal } from '@/components/ui'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

export const CreateForm: FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceId, projectId } = useParam()
  const appStore = useStore('appStore')
  const workspaceStore = useStore('workspaceStore')

  async function handleRequest(values: any) {
    const form: any = {
      projectId,
      name: values.name,
      nameSchema: [],
      interactiveMode: InteractiveModeEnum.GENERAL,
      kind: FormKindEnum.SURVEY
    }

    const result = await FormService.create(form)

    workspaceStore.addForm(projectId, {
      id: result,
      teamId: workspaceId,
      draft: true,
      status: 1,
      ...form
    })

    fetchForms()
    handleClose()

    navigate(`/workspace/${workspaceId}/project/${projectId}/form/${result}/create`)
  }

  async function fetchForms() {
    const result = await FormService.forms(projectId)
    workspaceStore.setForms(projectId, result)
  }

  function handleClose() {
    appStore.isCreateFormOpen = false
  }

  return (
    <Modal
      contentClassName="max-w-md"
      visible={appStore.isCreateFormOpen}
      onClose={handleClose}
      showCloseIcon
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('project.createForm')}
          </h1>
        </div>

        <Form.Custom
          submitText={t('project.bottom')}
          submitOptions={{
            type: 'primary'
          }}
          onlySubmitOnValueChange={true}
          request={handleRequest}
        >
          <Form.Item name="name" label={t('project.giveName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
})
