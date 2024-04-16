import { HiddenField } from '@heyform-inc/shared-types-enums'
import { nanoid } from '@heyform-inc/utils'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Modal } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'
import { FormService } from '@/service'
import { useParam } from '@/utils'

export const CreateHiddenField: FC<IModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()
  const { formId } = useParam()

  async function handleRequest(values: Record<string, string>) {
    const field: HiddenField = {
      id: nanoid(8),
      name: values.name
    }

    await FormService.createHiddenField({
      formId,
      fieldId: field.id,
      fieldName: field.name
    })

    dispatch({
      type: 'createHiddenField',
      payload: field
    })
    onClose?.()
  }

  return (
    <Modal contentClassName="max-w-md" visible={visible} onClose={onClose} showCloseIcon>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('formBuilder.createHiddenField')}
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
          <Form.Item
            name="name"
            label={t('formBuilder.hiddenFieldName')}
            rules={[{ required: true }]}
          >
            <Input placeholder={t('formBuilder.hiddenFieldNamePlaceholder')} />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
}
