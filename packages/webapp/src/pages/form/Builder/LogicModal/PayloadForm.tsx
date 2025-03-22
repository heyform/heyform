import { validatePayload } from '@heyform-inc/answer-utils'
import {
  ActionEnum,
  Choice,
  ComparisonEnum,
  FieldKindEnum,
  LogicAction,
  LogicCondition,
  LogicPayload,
  Variable
} from '@heyform-inc/shared-types-enums'
import { nanoid } from '@heyform-inc/utils'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { type FC, type ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Tooltip } from '@/components'
import { FormFieldType } from '@/types'

import Action from './Action'
import Condition from './Condition'

interface PayloadFormProps {
  form: any
  fields: FormFieldType[]
  currentField: FormFieldType
  variables?: Variable[]
  payloads: LogicPayload[]
  onFinish?: (values: any) => void
}

interface PayloadItemProps {
  fields: FormFieldType[]
  variables?: Variable[]
  currentField?: FormFieldType
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
  currentField,
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
            field={currentField!}
            value={value?.condition}
            onChange={handleConditionChange}
          />
          <Action
            fields={fields}
            currentField={currentField!}
            variables={variables}
            value={value?.action}
            onChange={handleActionChange}
          />
        </div>

        <Tooltip label={t('form.builder.logic.rule.deleteRule')}>
          <Button.Link
            className="text-secondary hover:text-primary"
            size="sm"
            iconOnly
            onClick={handleDelete}
          >
            <IconTrash className="h-5 w-5" />
          </Button.Link>
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
  currentField,
  children
}) => {
  const { t } = useTranslation()

  return (
    <Form.List name={name}>
      {(listFields, { add, remove }) => {
        function handleAdd() {
          add(
            getPayload(
              currentField?.kind,
              currentField?.properties?.choices,
              currentField?.properties?.allowMultiple
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
                      {...listField}
                      key={listField.key}
                      rules={[
                        {
                          required: true,
                          validator,
                          message: t('form.builder.logic.rule.required')
                        }
                      ]}
                    >
                      {({ value, onChange }) => {
                        return (
                          <PayloadItem
                            value={value}
                            fields={fields}
                            currentField={currentField}
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

            <Button.Ghost size="md" onClick={handleAdd}>
              <IconPlus className="h-5 w-5 text-secondary" />
              {t('form.builder.logic.rule.addRule')}
            </Button.Ghost>
          </div>
        )
      }}
    </Form.List>
  )
}

export const PayloadForm: FC<PayloadFormProps> = ({
  form,
  fields,
  currentField,
  variables = [],
  payloads,
  onFinish
}) => {
  useEffect(() => {
    form.setFieldsValue({
      payloads
    })
  }, [currentField, payloads])

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
        currentField={currentField}
        variables={variables}
      />
    </Form>
  )
}
