import { htmlUtils } from '@heyform-inc/answer-utils'
import { IconX } from '@tabler/icons-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, useForm } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'
import { FieldKindIcon } from '@/pages/form/Create/views/LeftSidebar/FieldKindIcon'
import { PayloadForm } from '@/pages/form/Create/views/LogicPanel/PayloadForm'

export const LogicPanel = () => {
  const [form] = useForm()
  const { state, dispatch } = useStoreContext()
  const { fields, selectedField, logics } = state
  const payloads = useMemo(() => {
    return logics?.find(l => l.fieldId === selectedField?.id)?.payloads || []
  }, [selectedField, logics])
	const { t } = useTranslation()

  function handleClose() {
    dispatch({
      type: 'togglePanel',
      payload: {
        isLogicPanelOpen: false
      }
    })
  }

  function handleRemoveAll() {
    dispatch({
      type: 'deleteLogic',
      payload: {
        fieldId: state.selectedField!.id
      }
    })
  }

  function handleSave() {
    form.submit()
  }

  function handleFinish({ payloads }: any) {
    handleClose()
    dispatch({
      type: 'setLogic',
      payload: {
        fieldId: state.selectedField!.id,
        payloads
      }
    })
  }

  return (
    <div className="logic-panel">
      <div className="flex justify-between bg-slate-50 px-4 py-6">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-slate-900">{t('formBuilder.rules')}</h2>
          {selectedField && (
            <div className="mt-2 flex flex-1 items-center justify-between">
              <FieldKindIcon
                kind={selectedField.kind}
                index={selectedField.index}
                parentIndex={selectedField.parent?.index}
              />
              <div className="flex-1 truncate">
                {htmlUtils.plain(selectedField.title as string)}
              </div>
            </div>
          )}
        </div>
        <Button.Link className="h-8 w-8" leading={<IconX />} onClick={handleClose} />
      </div>

      <div className="scrollbar flex-1 space-y-4 px-4 py-8">
        <PayloadForm
          form={form}
          fields={fields}
          selectedField={selectedField!}
          payloads={payloads}
          variables={state.variables}
          onFinish={handleFinish}
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 p-4">
        <Button.Link type="danger" onClick={handleRemoveAll}>
          {t('formBuilder.removeAll')}
        </Button.Link>
        <div className="flex items-center">
          <Button onClick={handleClose}>{t('formSettings.Cancel')}</Button>
          <Button className="ml-4" type="primary" onClick={handleSave}>
            {t('formBuilder.addRule')}
          </Button>
        </div>
      </div>
    </div>
  )
}
