import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Modal, useForm } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'
import { FormService } from '@/service'
import { useParam } from '@/utils'

interface EditHiddenFieldProps extends IModalProps {
  hiddenField: any
}

export const EditHiddenField: FC<EditHiddenFieldProps> = ({ visible, hiddenField, onClose }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()
  const { formId } = useParam()
  const [form] = useForm()

  async function handleRequest(values: Record<string, string>) {
    await FormService.updateHiddenField({
      formId,
      fieldId: hiddenField.id,
      fieldName: values.name
    })

    dispatch({
      type: 'editHiddenField',
      payload: {
        id: hiddenField.id,
        name: values.name
      }
    })
    onClose?.()
  }

  return (
    <Modal contentClassName="max-w-md" visible={visible} onClose={onClose} showCloseIcon>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('formBuilder.editHiddenField')}
          </h1>
        </div>

        <Form.Custom
          initialValues={hiddenField}
          form={form}
          submitText={t('project.bottom')}
          submitOptions={{
            type: 'primary'
          }}
          onlySubmitOnValueChange={true}
          request={handleRequest}
        >
          <Form.Item
            name="name"
            label={t('formBuilder.hiddenFieldName')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
}
