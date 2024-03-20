import { ActionEnum, type LogicAction, type Variable } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconPlus } from '@tabler/icons-react'
import clsx from 'clsx'
import { type FC, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { flattenFieldsWithGroups } from '@/components/formComponents'
import { Button, Input, Select } from '@/components/ui'
import { type FormField } from '@/models'
import { useStoreContext } from '@/pages/form/Create/store'
import { KIND_OPTIONS, OPERATOR_OPTIONS } from '@/pages/form/Create/views/FieldConfig'

import { FieldSelect } from './FieldSelect'

interface ActionProps {
  fields: FormField[]
  selectedField: FormField
  variables?: Variable[]
  value?: LogicAction
  onChange?: (value: LogicAction) => void
}

export const Action: FC<ActionProps> = ({
  fields: rawFields,
  selectedField,
  variables = [],
  value: rawValue,
  onChange
}) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()
  const [value, setValue] = useState<any>(rawValue!)
  const [htmlType, setHtmlType] = useState<string>('text')

  const fields = useMemo(() => {
    const tmpFields = flattenFieldsWithGroups(rawFields)
    const index = tmpFields.findIndex(f => f.id === selectedField.id)

    return tmpFields.slice(index + 1)
  }, [rawFields, selectedField])

  function handleKindChange(kind: any) {
    if (kind === ActionEnum.CALCULATE) {
      let { variable, operator } = value as any

      if (helper.isEmpty(variable) && helper.isValidArray(variables)) {
        variable = variables[0].id
      }

      if (helper.isEmpty(operator)) {
        operator = OPERATOR_OPTIONS[0].value
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

  function handleAddVariable() {
    dispatch({
      type: 'togglePanel',
      payload: {
        isVariablePanelOpen: true
      }
    })
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
      className={clsx('rule-action', {
        'rule-action-calculate': value.kind === ActionEnum.CALCULATE
      })}
    >
      <div className="flex items-center">{t('formBuilder.then')}</div>
      <Select
        className="w-auto flex-1"
        options={KIND_OPTIONS}
        value={value.kind}
        onChange={handleKindChange}
      />
      {value.kind === ActionEnum.NAVIGATE ? (
        <FieldSelect fields={fields} value={value.fieldId} onChange={handleFieldChange} />
      ) : helper.isValidArray(variables) ? (
        <>
          <Select
            className="w-auto flex-1"
            options={variables as any}
            labelKey="name"
            valueKey="id"
            value={value.variable}
            placeholder="Variable"
            onChange={handleVariableChange}
          />
          <Select
            className="w-auto flex-1"
            options={OPERATOR_OPTIONS}
            value={value.operator}
            placeholder="Operator"
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
        <Button.Link leading={<IconPlus />} onClick={handleAddVariable}>
          {t('formBuilder.variable.add')}
        </Button.Link>
      )}
    </div>
  )
}
