import {
  ActionEnum,
  Choice,
  ComparisonEnum,
  FieldKindEnum,
  Logic,
  LogicAction,
  LogicCondition,
  LogicPayload,
  UNSELECTABLE_FIELD_KINDS,
  Variable
} from '@heyform-inc/shared-types-enums'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useWatch } from 'rc-field-form'
import { type FC, type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  canBranchByAnswer,
  countUnmappedJumps,
  getChoiceDestinations,
  getPayloadFormValues
} from '../utils'
import { htmlUtils, validatePayload } from '@heyform-inc/answer-utils'
import { nanoid } from '@heyform-inc/utils'

import { Button, Form, Switch, Tooltip } from '@/components'
import { FormFieldType } from '@/types'

import Action from './Action'
import Condition from './Condition'
import { NextQuestionSelect } from './NextQuestionSelect'

interface PayloadFormProps {
  form: any
  fields: FormFieldType[]
  currentField: FormFieldType
  variables?: Variable[]
  logic?: Logic
  onFinish?: (values: any) => void
}

interface PayloadItemProps {
  fields: FormFieldType[]
  variables?: Variable[]
  currentField?: FormFieldType
  actionKinds?: ActionEnum[]
  value?: LogicPayload
  onDelete?: () => void
  onChange?: (value: LogicPayload) => void
}

const validator = async (rule: any, value: any) => {
  if (!validatePayload(value)) {
    throw new Error(rule.message as string)
  }
}

// Branching questions jump via per-answer destinations, so their rule list only holds calculations.
const BRANCHING_ACTION_KINDS = [ActionEnum.CALCULATE]

function isNavigatePayload(payload: LogicPayload): boolean {
  return payload.action?.kind === ActionEnum.NAVIGATE
}

function getPayload(
  kind?: FieldKindEnum,
  choices: Choice[] = [],
  allowMultiple = false,
  actionKind = ActionEnum.NAVIGATE
): LogicPayload {
  const payload: any = {
    id: nanoid(12),
    condition: {},
    action: {
      kind: actionKind
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
  actionKinds,
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
            actionKinds={actionKinds}
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
  actionKinds,
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
              currentField?.properties?.allowMultiple,
              actionKinds?.[0]
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
                            actionKinds={actionKinds}
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
              <IconPlus className="text-secondary h-5 w-5" />
              {t('form.builder.logic.rule.addRule')}
            </Button.Ghost>
          </div>
        )
      }}
    </Form.List>
  )
}

interface ChoiceBranchingProps {
  fields: FormFieldType[]
  currentField: FormFieldType
  isBranching: boolean
  droppedRuleCount: number
  onBranchingChange: (branching: boolean) => void
}

const ChoiceBranching: FC<ChoiceBranchingProps> = ({
  fields,
  currentField,
  isBranching,
  droppedRuleCount,
  onBranchingChange
}) => {
  const { t } = useTranslation()
  const isIncompatible = !!(
    currentField.properties?.allowMultiple || currentField.properties?.allowOther
  )

  return (
    <div className="mb-6 space-y-4">
      <Form.Item
        name="branching"
        rules={[
          {
            validator: async (_, branching) => {
              if (branching && isIncompatible) {
                throw new Error(t('form.builder.logic.branching.incompatible'))
              }
            }
          }
        ]}
      >
        {({ value, onChange }) => (
          <div className="flex items-start justify-between gap-x-4">
            <div>
              <div className="text-sm/6 font-medium">
                {String(t('form.builder.logic.branching.label'))}
              </div>
              <p className="text-secondary text-sm">
                {String(
                  isIncompatible
                    ? t('form.builder.logic.branching.incompatible')
                    : t('form.builder.logic.branching.description')
                )}
              </p>
            </div>
            {/* An already-branching question can always be switched off. */}
            <Switch
              value={value}
              disabled={isIncompatible && !value}
              onChange={(checked: boolean) => {
                onChange(checked)
                onBranchingChange(checked)
              }}
            />
          </div>
        )}
      </Form.Item>

      {isBranching ? (
        <div className="space-y-3">
          {droppedRuleCount > 0 && (
            <p className="text-error text-sm">
              {String(t('form.builder.logic.branching.droppedRules', { count: droppedRuleCount }))}
            </p>
          )}
          {(currentField.properties?.choices || []).map((choice, index) => (
            <div key={choice.id} className="flex items-start gap-x-4">
              <div className="w-1/3 truncate text-sm leading-9">
                {htmlUtils.plain(choice.label) ||
                  String(t('form.builder.logic.branching.untitledOption', { index: index + 1 }))}
              </div>
              <Form.Item
                className="flex-1"
                name={['destinations', choice.id]}
                rules={[
                  {
                    required: true,
                    message: t('form.builder.logic.branching.destinationRequired')
                  }
                ]}
              >
                <NextQuestionSelect
                  fields={fields}
                  currentField={currentField}
                  emptyLabel={t('form.builder.logic.branching.destinationPlaceholder')}
                />
              </Form.Item>
            </div>
          ))}
        </div>
      ) : (
        <NextQuestionItem fields={fields} currentField={currentField} />
      )}
    </div>
  )
}

const NextQuestionItem: FC<Pick<ChoiceBranchingProps, 'fields' | 'currentField'>> = ({
  fields,
  currentField
}) => {
  const { t } = useTranslation()

  return (
    <>
      <Form.Item name="nextFieldId" label={String(t('form.builder.logic.nextQuestion.label'))}>
        <NextQuestionSelect fields={fields} currentField={currentField} />
      </Form.Item>
      <p className="text-secondary mb-6 text-sm">
        {String(t('form.builder.logic.nextQuestion.description'))}
      </p>
    </>
  )
}

export const PayloadForm: FC<PayloadFormProps> = ({
  form,
  fields,
  currentField,
  variables = [],
  logic,
  onFinish
}) => {
  const initialValues = useMemo(
    () => getPayloadFormValues(currentField, logic),
    [currentField, logic]
  )
  const isChoiceField = canBranchByAnswer(currentField)
  const isBranching = !!useWatch('branching', form)
  // Jump rules taken out of the rule list while branching is on, restored if it's switched off.
  const [jumps, setJumps] = useState<LogicPayload[]>([])

  function handleBranchingChange(branching: boolean) {
    const payloads: LogicPayload[] = form.getFieldValue('payloads') || []
    const others = payloads.filter(p => !isNavigatePayload(p))

    if (branching) {
      const navigates = payloads.filter(isNavigatePayload)

      setJumps(navigates)
      form.setFieldsValue({ payloads: others })
      form.setFields([{ name: 'destinations', value: getChoiceDestinations(navigates) }])
    } else {
      form.setFieldsValue({ payloads: [...jumps, ...others] })
    }
  }

  useEffect(() => {
    form.setFieldsValue(initialValues)
    setJumps(initialValues.branching ? (logic?.payloads || []).filter(isNavigatePayload) : [])
  }, [initialValues])

  return (
    <Form initialValues={initialValues} form={form} onFinish={onFinish}>
      {isChoiceField ? (
        <ChoiceBranching
          fields={fields}
          currentField={currentField}
          isBranching={isBranching}
          droppedRuleCount={isBranching ? countUnmappedJumps(currentField, jumps) : 0}
          onBranchingChange={handleBranchingChange}
        />
      ) : (
        <NextQuestionItem fields={fields} currentField={currentField} />
      )}
      {!UNSELECTABLE_FIELD_KINDS.includes(currentField.kind) && (
        <PayloadList
          name="payloads"
          fields={fields}
          currentField={currentField}
          variables={variables}
          actionKinds={isBranching ? BRANCHING_ACTION_KINDS : undefined}
        />
      )}
    </Form>
  )
}
