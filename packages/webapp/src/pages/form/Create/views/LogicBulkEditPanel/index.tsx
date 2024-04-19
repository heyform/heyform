import { htmlUtils } from '@heyform-inc/answer-utils'
import { Logic, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconX } from '@tabler/icons-react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, useForm } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'
import { UNSELECTABLE_FIELD_KINDS } from '@/pages/form/Create/views/FieldConfig'
import { flattenFieldsWithGroups } from '@/pages/form/views/FormComponents'

import { FieldKindIcon } from '../LeftSidebar/FieldKindIcon'
import { PayloadList } from '../LogicPanel/PayloadForm'

export const LogicBulkEditPanel = () => {
  const [form] = useForm()
  const { t } = useTranslation()
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
    dispatch({
      type: 'togglePanel',
      payload: {
        isBulkEditPanelOpen: false
      }
    })
  }

  function handleRemoveAll() {
    form.resetFields()
  }

  function handleSave() {
    form.submit()
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

      form.setFieldsValue(result)
    }
  }, [fields, logics])

  return (
    <div className="logic-bulk-edit-panel">
      <div className="flex justify-between bg-slate-50 px-4 py-6">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-slate-900">{t('formBuilder.bulkEdit')}</h2>
          <p>{t('formBuilder.bulkEditDescription')}</p>
        </div>
        <Button.Link className="h-8 w-8" leading={<IconX />} onClick={handleClose} />
      </div>

      <div className="scrollbar flex-1 space-y-4 px-4 py-8">
        <Form className="space-y-6 divide-y divide-gray-100" form={form} onFinish={handleFinish}>
          {fields.map(field => (
            <PayloadList
              className="payload-list"
              key={field.id}
              name={field.id}
              fields={rawFields}
              selectedField={field}
              variables={variables}
            >
              <div className="mb-4 flex items-center">
                <FieldKindIcon
                  kind={field.kind}
                  index={field.index}
                  parentIndex={field.parent?.index}
                />
                <div className="truncate">{htmlUtils.plain(field.title as string)}</div>
              </div>
            </PayloadList>
          ))}
        </Form>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 p-4">
        <Button.Link type="danger" onClick={handleRemoveAll}>
          {t('formBuilder.removeAll')}
        </Button.Link>
        <div className="flex items-center">
          <Button onClick={handleClose}>{t('formBuilder.cancel')}</Button>
          <Button className="ml-4" type="primary" onClick={handleSave}>
            {t('formBuilder.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  )
}
