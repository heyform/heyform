import { FieldKindEnum, LogicCondition } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { type FC, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input, Select } from '@/components/ui'
import { type FormField } from '@/models'
import {
  DATE_CONDITION_OPTIONS,
  DEFAULT_CONDITION_OPTIONS,
  MULTIPLE_CHOICE_CONDITION_OPTIONS,
  NUMBER_CONDITION_OPTIONS,
  SINGLE_CHOICE_CONDITIONS,
  SINGLE_CHOICE_CONDITION_OPTIONS,
  TEXT_CONDITION_OPTIONS
} from '@/pages/form/Create/views/FieldConfig'

interface ConditionProps {
  field: FormField
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
      popupClassName="condition-select-popup"
      options={DEFAULT_CONDITION_OPTIONS}
      value={value?.comparison}
      onChange={onComparisonChange}
    />
  )
}

const TextCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
	const { t } = useTranslation()

  return (
    <>
      <Select
        className="w-auto flex-1"
        popupClassName="condition-select-popup"
        options={TEXT_CONDITION_OPTIONS}
        value={value?.comparison}
        onChange={onComparisonChange}
      />
      <Input
        className="flex-1"
        value={(value as any).expected}
        placeholder={t('formBuilder.value')}
        onChange={onExpectedChange}
      />
    </>
  )
}

const SingleChoiceCondition: FC<DefaultProps & { field: FormField }> = ({
  value,
  field,
  onComparisonChange,
  onExpectedChange
}) => {
  return (
    <>
      <Select
        className="w-auto flex-1"
        popupClassName="condition-select-popup"
        options={SINGLE_CHOICE_CONDITION_OPTIONS}
        value={value?.comparison}
        onChange={onComparisonChange}
      />
      <Select
        className="flex-1"
        popupClassName="condition-select-popup"
        options={(field.properties?.choices || []) as any[]}
        valueKey="id"
        value={value?.expected}
        onChange={onExpectedChange}
      />
    </>
  )
}

const MultipleChoiceCondition: FC<DefaultProps & { field: FormField }> = ({
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
        <Select.Multiple
          className="flex-1"
          popupClassName="condition-select-popup"
          allowSearch={false}
          options={field.properties?.choices as any}
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
        popupClassName="condition-select-popup"
        options={(field.properties?.choices || []) as any[]}
        valueKey="id"
        value={currValue}
        onChange={onExpectedChange}
      />
    )
  }, [field.properties?.allowMultiple, value?.comparison, value?.expected])

  return (
    <>
      <Select
        className="w-auto flex-1"
        popupClassName="condition-select-popup"
        options={MULTIPLE_CHOICE_CONDITION_OPTIONS}
        value={value?.comparison}
        onChange={onComparisonChange}
      />
      {MemoSelect}
    </>
  )
}

const BoolCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
	const { t } = useTranslation()
  const options = [
    {
      label: t('formBuilder.true'),
      value: true
    },
    {
      label: t('formBuilder.false'),
      value: false
    }
  ]

  return (
    <>
      <Select
        className="w-auto flex-1"
        popupClassName="condition-select-popup"
        options={SINGLE_CHOICE_CONDITION_OPTIONS}
        value={value?.comparison}
        onChange={onComparisonChange}
      />
      <Select
        className="flex-1"
        popupClassName="condition-select-popup"
        options={options}
        value={value?.expected}
        onChange={onExpectedChange}
      />
    </>
  )
}

const DateCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
	const { t } = useTranslation()

  return (
    <>
      <Select
        className="w-auto flex-1"
        popupClassName="condition-select-popup"
        options={DATE_CONDITION_OPTIONS}
        value={value?.comparison}
        onChange={onComparisonChange}
      />
      <Input
        className="flex-1"
        type="number"
        value={(value as any).expected}
        placeholder={t('formBuilder.value')}
        onChange={onExpectedChange}
      />
    </>
  )
}

const NumberCondition: FC<DefaultProps> = ({ value, onComparisonChange, onExpectedChange }) => {
	const { t } = useTranslation()

  return (
    <>
      <Select
        className="w-auto flex-1"
        popupClassName="condition-select-popup"
        options={NUMBER_CONDITION_OPTIONS}
        value={value?.comparison}
        onChange={onComparisonChange}
      />
      <Input
        className="flex-1"
        type="number"
        value={(value as any).expected}
        placeholder={t('formBuilder.value')}
        onChange={onExpectedChange}
      />
    </>
  )
}

export const Condition: FC<ConditionProps> = ({ field, value: rawValue, onChange }) => {
  const { t } = useTranslation()
  const [value, setValue] = useState<LogicCondition>(rawValue!)

  function handleComparisonChange(comparison: any) {
    handleChange({ ...value, comparison })
  }

  function handleExpectedChange(expected: any) {
    handleChange({ ...value, expected })
  }

  function handleChange(newValue: any) {
    setValue(newValue)
    onChange?.(newValue)
  }

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
  }, [field.kind, value])

  return (
    <div className="rule-condition">
      <div className="flex items-center">{t('formBuilder.when')}</div>
      {Element}
    </div>
  )
}
