import { type Variable } from '@heyform-inc/shared-types-enums'
import { helper, nanoid } from '@heyform-inc/utils'
import { IconX } from '@tabler/icons-react'
import { type FC, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input } from '@/components/ui'
import { VARIABLE_INPUT_TYPES } from '@/pages/form/Create/consts'
import { useStoreContext } from '@/pages/form/Create/store'

import { KindSelect } from '../RightSidebar/Logic/KindSelect'

export const VariablePanel: FC = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()
  const [kind, setKind] = useState<string>('number')
  const isEditing = useMemo(() => helper.isValid(state.selectedVariable), [state.selectedVariable])

  function handleClose() {
    dispatch({
      type: 'togglePanel',
      payload: {
        isVariablePanelOpen: false
      }
    })
  }

  async function handleFinish(values: Variable) {
    if (isEditing) {
      dispatch({
        type: 'updateVariable',
        payload: {
          id: state.selectedVariable!.id,
          updates: values
        }
      })
    } else {
      dispatch({
        type: 'addVariable',
        payload: {
          ...values,
          id: nanoid(12)
        }
      })
    }

    handleClose()
  }

  function handleValuesChange(changes: any) {
    if (changes.kind) {
      setKind(changes.kind)
    }
  }

  useEffect(() => {
    if (state.selectedVariable) {
      setKind(state.selectedVariable.kind)
    }
  }, [state.selectedVariable])

  return (
    <div className="variable-panel">
      <div className="flex items-start justify-between bg-slate-50 px-4 py-6">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-slate-900">{t('formBuilder.variable.title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('formBuilder.variable.description')}</p>
        </div>
        <Button.Link className="h-8 w-8" leading={<IconX />} onClick={handleClose} />
      </div>

      <div className="scrollbar flex-1 px-4 py-8">
        <Form.Custom
          initialValues={{
            kind,
            ...state.selectedVariable
          }}
          submitText={t(
            isEditing ? 'formBuilder.variable.updateButton' : 'formBuilder.variable.addButton'
          )}
          submitOptions={{
            type: 'primary'
          }}
          request={handleFinish}
          onValuesChange={handleValuesChange}
        >
          <Form.Item
            name="kind"
            label={t('formBuilder.variable.type')}
            rules={[{ required: true }]}
          >
            <KindSelect />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('formBuilder.variable.name')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="value"
            label={t('formBuilder.variable.default')}
            rules={[{ required: true }]}
          >
            <Input type={VARIABLE_INPUT_TYPES[kind]} />
          </Form.Item>
        </Form.Custom>
      </div>
    </div>
  )
}
