import { htmlUtils } from '@heyform-inc/answer-utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Modal } from '@/components'
import { useAppStore, useModal } from '@/store'

import { QuestionIcon } from '../LeftSidebar/QuestionList'
import { useStoreContext } from '../store'
import { PayloadForm } from './PayloadForm'

const LogicComponent = () => {
  const { t } = useTranslation()

  const [rcForm] = Form.useForm()
  const { closeModal } = useAppStore()
  const { state, dispatch } = useStoreContext()
  const { fields, currentField, logics } = state

  const payloads = useMemo(() => {
    return logics?.find(l => l.fieldId === currentField?.id)?.payloads || []
  }, [currentField, logics])

  function handleClose() {
    closeModal('LogicModal')
  }

  function handleRemoveAll() {
    dispatch({
      type: 'deleteLogic',
      payload: {
        fieldId: state.currentField!.id
      }
    })
  }

  function handleSave() {
    rcForm.submit()
  }

  function handleFinish({ payloads }: AnyMap) {
    handleClose()
    dispatch({
      type: 'setLogic',
      payload: {
        fieldId: state.currentField!.id,
        payloads
      }
    })
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="border-b border-accent-light p-4">
        <h2 className="text-lg font-medium text-slate-900">
          {t('form.builder.logic.rule.headline')}
        </h2>

        {currentField && (
          <div className="mt-2 flex flex-1 items-center justify-between gap-x-2">
            <QuestionIcon
              kind={currentField.kind}
              index={currentField.index}
              parentIndex={currentField.parent?.index}
            />
            <div className="flex-1 truncate">{htmlUtils.plain(currentField.title as string)}</div>
          </div>
        )}
      </div>

      <div className="scrollbar h-[calc(70vh-10.35rem)] flex-1 space-y-4 p-4">
        <PayloadForm
          form={rcForm}
          fields={fields}
          currentField={currentField!}
          payloads={payloads}
          variables={state.variables}
          onFinish={handleFinish}
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 p-4">
        <Button.Link size="md" className="text-error" onClick={handleRemoveAll}>
          {t('form.builder.logic.rule.removeAll')}
        </Button.Link>

        <div className="flex items-center">
          <Button.Ghost size="md" onClick={handleClose}>
            {t('components.cancel')}
          </Button.Ghost>
          <Button className="ml-4" size="md" onClick={handleSave}>
            {t('components.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LogicModal() {
  const { isOpen, onOpenChange } = useModal('LogicModal')

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className: 'max-w-4xl p-0 overflow-hidden'
      }}
      onOpenChange={onOpenChange}
    >
      <LogicComponent />
    </Modal>
  )
}
