import { FieldKindEnum, LogicCondition } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { type FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input, Select } from '@/components'
import {
  DATE_CONDITIONS,
  DEFAULT_COMPARISONS,
  MULTIPLE_CHOICE_CONDITIONS,
  NUMBER_CONDITIONS,
  SINGLE_CHOICE_CONDITIONS,
  TEXT_CONDITIONS,
  TRUE_FALSE_CONDITIONS
} from '@/consts'
import { FormFieldType } from '@/types'

interface ConditionProps {
  field: FormFieldType
  value?: LogicCondition
  onChange?: (value: LogicCondition) => void
}

interface DefaultProps {
  value?: any
  onComparisonChange: (value: any) => void
  onExpectedChange?: (value: any) => void
}

const DefaultCondition: FC<DefaultProps> = ({ value, onComparisonChange }) => {
  return (
    <Select
      className="w-auto flex-1"
      options={DEFAULT_COMPARISONS}
      value={value?.comparison}
      multiLanguage
      onChange={onComparisonChange}
    />
  )
}

const TextCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
  return (
    <>
      <Select
        className="w-auto flex-1"
        options={TEXT_CONDITIONS}
        value={value?.comparison}
        multiLanguage
        onChange={onComparisonChange}
      />
      <Input
        className="flex-1"
        value={(value as Any).expected}
        placeholder="Value"
        onChange={onExpectedChange}
      />
    </>
  )
}

const SingleChoiceCondition: FC<DefaultProps & { field: FormFieldType }> = ({
  value,
  field,
  onComparisonChange,
  onExpectedChange
}) => {
  return (
    <>
      <Select
        className="w-auto flex-1"
        options={SINGLE_CHOICE_CONDITIONS}
        value={value?.comparison}
        multiLanguage
        onChange={onComparisonChange}
      />
      <Select
        className="flex-1"
        options={(field.properties?.choices || []) as AnyMap[]}
        valueKey="id"
        value={value?.expected}
        onChange={onExpectedChange}
      />
    </>
  )
}

const MultipleChoiceCondition: FC<DefaultProps & { field: FormFieldType }> = ({
  value,
  field,
  onComparisonChange,
  onExpectedChange
}) => {
  const MemoSelect = useMemo(() => {
    if (field.properties?.allowMultiple && SINGLE_CHOICE_CONDITIONS.includes(value?.comparison)) {
      const currValue = helper.isArray(value?.expected)
        ? value?.expected
        : [value?.expected].filter(helper.isValid)

      return (
        <Select.Multi
          className="flex-1"
          options={(field.properties?.choices || []) as AnyMap[]}
          valueKey="id"
          value={currValue}
          onChange={onExpectedChange}
        />
      )
    }

    const currValue = helper.isValidArray(value?.expected) ? value!.expected[0] : value?.expected

    return (
      <Select
        className="flex-1"
        options={(field.properties?.choices || []) as AnyMap[]}
        valueKey="id"
        value={currValue}
        onChange={onExpectedChange}
      />
    )
  }, [field.properties?.allowMultiple, onExpectedChange, value])

  return (
    <>
      <Select
        className="w-auto flex-1"
        options={MULTIPLE_CHOICE_CONDITIONS}
        value={value?.comparison}
        multiLanguage
        onChange={onComparisonChange}
      />
      {MemoSelect}
    </>
  )
}

const BoolCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
  return (
    <>
      <Select
        className="w-auto flex-1"
        options={SINGLE_CHOICE_CONDITIONS}
        value={value?.comparison}
        multiLanguage
        onChange={onComparisonChange}
      />
      <Select
        className="flex-1"
        type="boolean"
        options={TRUE_FALSE_CONDITIONS}
        value={value?.expected}
        multiLanguage
        onChange={onExpectedChange}
      />
    </>
  )
}

const DateCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
  return (
    <>
      <Select
        className="w-auto flex-1"
        options={DATE_CONDITIONS}
        value={value?.comparison}
        multiLanguage
        onChange={onComparisonChange}
      />
      <Input
        className="flex-1"
        type="number"
        value={(value as Any).expected}
        placeholder="Value"
        onChange={onExpectedChange}
      />
    </>
  )
}

const NumberCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
  return (
    <>
      <Select
        className="w-auto flex-1"
        options={NUMBER_CONDITIONS}
        value={value?.comparison}
        multiLanguage
        onChange={onComparisonChange}
      />
      <Input
        className="flex-1"
        type="number"
        value={(value as Any).expected}
        placeholder="Value"
        onChange={onExpectedChange}
      />
    </>
  )
}

export default function Condition({ field, value: rawValue, onChange }: ConditionProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState<LogicCondition>(rawValue!)

  const handleChange = useCallback(
    (newValue: any) => {
      setValue(newValue)
      onChange?.(newValue)
    },
    [onChange]
  )

  const handleComparisonChange = useCallback(
    (comparison: any) => {
      handleChange({ ...value, comparison })
    },
    [handleChange, value]
  )

  const handleExpectedChange = useCallback(
    (expected: any) => {
      handleChange({ ...value, expected })
    },
    [handleChange, value]
  )

  const Element = useMemo(() => {
    switch (field.kind) {
      case FieldKindEnum.SHORT_TEXT:
      case FieldKindEnum.LONG_TEXT:
      case FieldKindEnum.EMAIL:
      case FieldKindEnum.PHONE_NUMBER:
      case FieldKindEnum.URL:
        return (
          <TextCondition
            value={value}
            onComparisonChange={handleComparisonChange}
            onExpectedChange={handleExpectedChange}
          />
        )

      case FieldKindEnum.YES_NO:
        return (
          <SingleChoiceCondition
            field={field}
            value={value}
            onComparisonChange={handleComparisonChange}
            onExpectedChange={handleExpectedChange}
          />
        )

      case FieldKindEnum.LEGAL_TERMS:
        return (
          <BoolCondition
            value={value}
            onComparisonChange={handleComparisonChange}
            onExpectedChange={handleExpectedChange}
          />
        )

      case FieldKindEnum.MULTIPLE_CHOICE:
      case FieldKindEnum.PICTURE_CHOICE:
        return (
          <MultipleChoiceCondition
            field={field}
            value={value}
            onComparisonChange={handleComparisonChange}
            onExpectedChange={handleExpectedChange}
          />
        )

      case FieldKindEnum.DATE:
        return (
          <DateCondition
            value={value}
            onComparisonChange={handleComparisonChange}
            onExpectedChange={handleExpectedChange}
          />
        )

      case FieldKindEnum.NUMBER:
      case FieldKindEnum.RATING:
      case FieldKindEnum.OPINION_SCALE:
        return (
          <NumberCondition
            value={value}
            onComparisonChange={handleComparisonChange}
            onExpectedChange={handleExpectedChange}
          />
        )

      default:
        return <DefaultCondition value={value} onComparisonChange={handleComparisonChange} />
    }
  }, [field, handleComparisonChange, handleExpectedChange, value])

  return (
    <div className="rule-condition">
      <div className="text-sm leading-10">{t('form.builder.logic.rule.when')}</div>
      {Element}
    </div>
  )
}
