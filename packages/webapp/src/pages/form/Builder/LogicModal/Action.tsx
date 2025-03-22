import { htmlUtils } from '@heyform-inc/answer-utils'
import { flattenFieldsWithGroups } from '@heyform-inc/form-renderer'
import { ActionEnum, LogicAction, Variable } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconPlus } from '@tabler/icons-react'
import { type FC, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Input, Select } from '@/components'
import { ACTIONS, OPERATORS } from '@/consts'
import { useAppStore } from '@/store'
import { FormFieldType } from '@/types'
import { cn } from '@/utils'

import { QuestionIcon } from '../LeftSidebar/QuestionList'

interface QuestionSelectProps {
  fields: FormFieldType[]
  value?: string
  onChange?: (value: string) => void
}

interface ActionProps {
  fields: FormFieldType[]
  currentField: FormFieldType
  variables?: Variable[]
  value?: LogicAction
  onChange?: (value: LogicAction) => void
}

const QuestionSelect: FC<QuestionSelectProps> = ({ fields, value, onChange }) => {
  const options = useMemo(
    () =>
      fields.map(row => ({
        value: row.id,
        label: (
          <div className="flex w-full items-center gap-x-2">
            <QuestionIcon kind={row.kind} index={row.index} parentIndex={row.parent?.index} />
            <span className="flex-1 truncate text-left">
              {htmlUtils.plain(row.title as string)}
            </span>
          </div>
        )
      })),
    [fields]
  )

  return <Select options={options} value={value} onChange={onChange} />
}

export default function Action({
  fields: rawFields,
  currentField,
  variables = [],
  value: rawValue,
  onChange
}: ActionProps) {
  const { t } = useTranslation()

  const { openModal } = useAppStore()

  const [value, setValue] = useState<Any>(rawValue!)
  const [htmlType, setHtmlType] = useState<string>('text')

  const fields = useMemo(() => {
    const tmpFields = flattenFieldsWithGroups(rawFields)
    const index = tmpFields.findIndex(f => f.id === currentField.id)

    return tmpFields.slice(index + 1)
  }, [rawFields, currentField])

  function handleKindChange(kind: any) {
    if (kind === ActionEnum.CALCULATE) {
      let { variable, operator } = value as Any

      if (helper.isEmpty(variable) && helper.isValidArray(variables)) {
        variable = variables[0].id
      }

      if (helper.isEmpty(operator)) {
        operator = OPERATORS[0]
      }

      handleChange({ ...value, kind, variable, operator })
    } else {
      handleChange({ ...value, kind })
    }
  }

  function handleFieldChange(fieldId: string) {
    handleChange({
      ...value,
      fieldId
    })
  }

  function handleVariableChange(variable: any) {
    handleChange({ ...value, variable })
  }

  function handleOperatorChange(operator: any) {
    handleChange({ ...value, operator })
  }

  function handleInputChange(newValue: any) {
    handleChange({ ...value, value: newValue })
  }

  function handleChange(newValue: any) {
    setValue(newValue)
    onChange?.(newValue)
  }

  useEffect(() => {
    if (value?.kind === ActionEnum.CALCULATE && helper.isValidArray(variables)) {
      const variable = variables.find(v => v.id === value.variable)

      if (variable) {
        switch (variable.kind) {
          case 'string':
            setHtmlType('text')
            break

          case 'number':
            setHtmlType('number')
            break
        }
      }
    }
  }, [value.kind, value.variable, variables])

  return (
    <div
      className={cn('rule-action', {
        'rule-action-calculate': value.kind === ActionEnum.CALCULATE
      })}
    >
      <div className="text-sm leading-10">{t('form.builder.logic.rule.then')}</div>

      <Select
        className="w-auto flex-1"
        options={ACTIONS}
        value={value.kind}
        multiLanguage
        onChange={handleKindChange}
      />
      {value.kind === ActionEnum.NAVIGATE ? (
        <QuestionSelect fields={fields} value={value.fieldId} onChange={handleFieldChange} />
      ) : helper.isValidArray(variables) ? (
        <>
          <Select
            className="w-auto flex-1"
            options={variables}
            labelKey="name"
            valueKey="id"
            value={value.variable}
            placeholder="Variable"
            onChange={handleVariableChange}
          />
          <Select
            className="w-auto flex-1"
            options={OPERATORS}
            value={value.operator}
            placeholder="Operator"
            multiLanguage
            onChange={handleOperatorChange}
          />
          <Input
            type={htmlType}
            placeholder="Value"
            className="flex-1"
            value={value.value}
            onChange={handleInputChange}
          />
        </>
      ) : (
        <Button.Link onClick={() => openModal('VariableModal')}>
          <IconPlus />
          {t('form.builder.logic.variable.addVariable')}
        </Button.Link>
      )}
    </div>
  )
}
