import { htmlUtils } from '@heyform-inc/answer-utils'
import { flattenFieldsWithGroups } from '@heyform-inc/form-renderer'
import {
  Logic,
  QUESTION_FIELD_KINDS,
  UNSELECTABLE_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Modal } from '@/components'
import { useAppStore, useModal } from '@/store'

import { QuestionIcon } from '../LeftSidebar/QuestionList'
import { PayloadList } from '../LogicModal/PayloadForm'
import { useStoreContext } from '../store'

function LogicBulkEditComponent() {
  const { t } = useTranslation()

  const [rcForm] = Form.useForm()
  const { closeModal } = useAppStore()
  const { state, dispatch } = useStoreContext()
  const { fields: rawFields, logics, variables } = state

  const fields = useMemo(
    () =>
      flattenFieldsWithGroups(rawFields).filter(
        f => QUESTION_FIELD_KINDS.includes(f.kind) && !UNSELECTABLE_FIELD_KINDS.includes(f.kind)
      ),
    [rawFields]
  )

  function handleClose() {
    closeModal('LogicBulkEditModal')
  }

  function handleRemoveAll() {
    rcForm.resetFields()
  }

  function handleSave() {
    rcForm.submit()
  }

  function handleFinish(values: any) {
    const logics: Logic[] = []

    Object.keys(values).forEach(fieldId => {
      const payloads = values[fieldId]

      if (helper.isValidArray(payloads)) {
        logics.push({
          fieldId,
          payloads
        })
      }
    })

    dispatch({
      type: 'setLogics',
      payload: logics
    })
    handleClose()
  }

  useEffect(() => {
    if (helper.isValidArray(logics)) {
      const result: any = {}

      logics!.forEach(l => {
        const index = fields.findIndex(f => f.id === l.fieldId)

        if (index > -1) {
          result[l.fieldId] = l.payloads
        }
      })

      rcForm.setFieldsValue(result)
    }
  }, [fields, logics, rcForm])

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="border-b border-accent-light p-4">
        <h2 className="text-balance text-xl/6 font-semibold text-primary sm:text-lg/6">
          {t('form.builder.logic.rule.bulkEdit.headline')}
        </h2>
        <p className="mt-2 whitespace-pre-line text-base text-secondary sm:text-sm">
          {t('form.builder.logic.rule.bulkEdit.subHeadline')}
        </p>
      </div>

      <div className="scrollbar h-[calc(70vh-10.35rem)] flex-1 space-y-4 p-4">
        <Form
          className="space-y-6 divide-y divide-accent-light"
          form={rcForm}
          onFinish={handleFinish}
        >
          {fields.map(field => (
            <PayloadList
              className="payload-list"
              key={field.id}
              name={field.id}
              fields={rawFields}
              currentField={field}
              variables={variables}
            >
              <div className="mb-4 flex items-center gap-2">
                <QuestionIcon
                  kind={field.kind}
                  index={field.index}
                  parentIndex={field.parent?.index}
                />
                <div className="truncate text-sm/6">{htmlUtils.plain(field.title as string)}</div>
              </div>
            </PayloadList>
          ))}
        </Form>
      </div>

      <div className="flex items-center justify-between border-t border-accent-light p-4">
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

export default function LogicBulkEditModal() {
  const { isOpen, onOpenChange } = useModal('LogicBulkEditModal')

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className: 'max-w-4xl p-0 overflow-hidden'
      }}
      onOpenChange={onOpenChange}
    >
      <LogicBulkEditComponent />
    </Modal>
  )
}
