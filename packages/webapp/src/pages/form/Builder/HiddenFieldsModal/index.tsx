import { HiddenField } from '@heyform-inc/shared-types-enums'
import { helper, nanoid } from '@heyform-inc/utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Modal } from '@/components'
import { useAppStore, useModal } from '@/store'

import { useStoreContext } from '../store'

const HiddenFieldsComponent = () => {
  const { t } = useTranslation()

  const { state, dispatch } = useStoreContext()
  const { closeModal } = useAppStore()

  const [kind, setKind] = useState<string>('number')
  const isEditing = useMemo(
    () => helper.isValid(state.selectedHiddenField),
    [state.selectedHiddenField]
  )

  async function handleFinish(values: HiddenField) {
    if (isEditing) {
      dispatch({
        type: 'editHiddenField',
        payload: {
          id: state.selectedHiddenField!.id,
          name: values.name
        }
      })
    } else {
      dispatch({
        type: 'createHiddenField',
        payload: {
          ...values,
          id: nanoid(12)
        }
      })
    }

    closeModal('HiddenFieldsModal')
  }

  function handleValuesChange(changes: any) {
    if (changes.kind) {
      setKind(changes.kind)
    }
  }

  return (
    <Form.Simple
      className="space-y-4"
      initialValues={{
        kind,
        ...state.selectedHiddenField
      }}
      submitProps={{
        size: 'md',
        label: t(
          isEditing
            ? 'form.builder.logic.hiddenFields.updateHiddenField'
            : 'form.builder.logic.hiddenFields.addHiddenField'
        )
      }}
      fetch={handleFinish}
      submitOnChangedOnly
      onValuesChange={handleValuesChange}
    >
      <Form.Item
        name="name"
        label={t('form.builder.logic.hiddenFields.name')}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
    </Form.Simple>
  )
}

export default function HiddenFieldsModal() {
  const { t } = useTranslation()
  const { isOpen, onOpenChange } = useModal('HiddenFieldsModal')

  return (
    <Modal.Simple
      open={isOpen}
      title={t('form.builder.logic.hiddenFields.headline')}
      description={t('form.builder.logic.hiddenFields.subHeadline')}
      onOpenChange={onOpenChange}
    >
      <HiddenFieldsComponent />
    </Modal.Simple>
  )
}
