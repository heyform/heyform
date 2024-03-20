import { validatePayload } from '@heyform-inc/answer-utils'
import {
  ActionEnum,
  type Choice,
  ComparisonEnum,
  FieldKindEnum,
  type LogicAction,
  LogicCondition,
  type LogicPayload,
  type Variable
} from '@heyform-inc/shared-types-enums'
import { nanoid } from '@heyform-inc/utils'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { type FC, type ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Tooltip } from '@/components/ui'
import { type FormField } from '@/models'
import { Action } from '@/pages/form/Create/views/LogicPanel/Action'
import { Condition } from '@/pages/form/Create/views/LogicPanel/Condition'

interface PayloadFormProps {
  form: any
  fields: FormField[]
  selectedField: FormField
  variables?: Variable[]
  payloads: LogicPayload[]
  onFinish?: (values: any) => void
}

interface PayloadItemProps {
  fields: FormField[]
  variables?: Variable[]
  selectedField?: FormField
  value?: LogicPayload
  onDelete?: () => void
  onChange?: (value: LogicPayload) => void
}

const validator = async (rule: any, value: any) => {
  if (!validatePayload(value)) {
    throw new Error(rule.message as string)
  }
}

function getPayload(
  kind?: FieldKindEnum,
  choices: Choice[] = [],
  allowMultiple = false
): LogicPayload {
  const payload: any = {
    id: nanoid(12),
    condition: {},
    action: {
      kind: ActionEnum.NAVIGATE
    }
  }

  switch (kind) {
    case FieldKindEnum.SHORT_TEXT:
    case FieldKindEnum.LONG_TEXT:
    case FieldKindEnum.EMAIL:
    case FieldKindEnum.PHONE_NUMBER:
    case FieldKindEnum.URL:
    case FieldKindEnum.YES_NO:
    case FieldKindEnum.LEGAL_TERMS:
    case FieldKindEnum.DATE:
    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      payload.condition.comparison = ComparisonEnum.IS
      break

    case FieldKindEnum.NUMBER:
    case FieldKindEnum.RATING:
    case FieldKindEnum.OPINION_SCALE:
      payload.condition.comparison = ComparisonEnum.EQUAL
      break

    default:
      payload.condition.comparison = ComparisonEnum.IS_NOT_EMPTY
      break
  }

  if (FieldKindEnum.LEGAL_TERMS === kind) {
    payload.condition.expected = true
  } else if (FieldKindEnum.YES_NO === kind) {
    payload.condition.expected = choices[0]?.id
  } else if (FieldKindEnum.MULTIPLE_CHOICE === kind || FieldKindEnum.PICTURE_CHOICE === kind) {
    payload.condition.expected = allowMultiple ? [choices[0]?.id] : choices[0]?.id
  }

  return payload
}

export const PayloadItem: FC<PayloadItemProps> = ({
  fields,
  variables = [],
  selectedField,
  value,
  onDelete,
  onChange
}) => {
  const { t } = useTranslation()

  function handleConditionChange(condition: LogicCondition) {
    onChange?.({ ...value, condition } as LogicPayload)
  }

  function handleActionChange(action: LogicAction) {
    onChange?.({ ...value, action } as LogicPayload)
  }

  function handleDelete() {
    onDelete?.()
  }

  return (
    <div className="payload-item">
      <div className="payload-item-content">
        <div className="flex-1 space-y-2">
          <Condition
            field={selectedField!}
            value={value?.condition}
            onChange={handleConditionChange}
          />
          <Action
            fields={fields}
            selectedField={selectedField!}
            variables={variables}
            value={value?.action}
            onChange={handleActionChange}
          />
        </div>
        <Tooltip ariaLabel={t('formBuilder.deleteRule')}>
          <Button.Link className="-mr-2" leading={<IconTrash />} onClick={handleDelete} />
        </Tooltip>
      </div>
    </div>
  )
}

interface PayloadListProps extends PayloadItemProps {
  name: string
  className?: string
  children?: ReactNode
}

export const PayloadList: FC<PayloadListProps> = ({
  className,
  name,
  fields,
  variables = [],
  selectedField,
  children
}) => {
  return (
    <Form.List name={name}>
      {(listFields, { add, remove }) => {
        function handleAdd() {
          add(
            getPayload(
              selectedField?.kind,
              selectedField?.properties?.choices,
              selectedField?.properties?.allowMultiple
            )
          )
        }

        return (
          <div className={className}>
            {children}

            {listFields.length > 0 && (
              <div className="mb-4 space-y-6">
                {listFields.map((listField, index) => {
                  function handleDelete() {
                    remove(index)
                  }

                  return (
                    <Form.Item
                      rules={[
                        {
                          required: true,
                          validator,
                          message: 'This field is required'
                        }
                      ]}
                      {...listField}
                    >
                      {({ value, onChange }) => {
                        return (
                          <PayloadItem
                            value={value}
                            fields={fields}
                            selectedField={selectedField}
                            variables={variables}
                            onDelete={handleDelete}
                            onChange={onChange}
                          />
                        )
                      }}
                    </Form.Item>
                  )
                })}
              </div>
            )}

            <Button className="px-4 py-1.5" leading={<IconPlus />} onClick={handleAdd}>
              Add rule
            </Button>
          </div>
        )
      }}
    </Form.List>
  )
}

export const PayloadForm: FC<PayloadFormProps> = ({
  form,
  fields,
  selectedField,
  variables = [],
  payloads,
  onFinish
}) => {
  useEffect(() => {
    form.setFieldsValue({
      payloads
    })
  }, [selectedField, payloads])

  return (
    <Form
      initialValues={{
        payloads
      }}
      form={form}
      onFinish={onFinish}
    >
      <PayloadList
        name="payloads"
        fields={fields}
        selectedField={selectedField}
        variables={variables}
      />
    </Form>
  )
}
