import { ChoiceBadgeEnum, Validation } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input, Select, Switch } from '@/components'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

interface RangeProps {
  min: number
  max: number
  value?: Validation
  onChange?: (value: Validation) => void
}

enum RangeTypeEnum {
  UNLIMITED,
  EXACT_NUMBER,
  RANGE
}

const RANGE_OPTIONS = [
  {
    value: RangeTypeEnum.UNLIMITED,
    label: 'form.builder.settings.multipleChoice.unlimited'
  },
  {
    value: RangeTypeEnum.EXACT_NUMBER,
    label: 'form.builder.settings.multipleChoice.exactNumber'
  },
  {
    value: RangeTypeEnum.RANGE,
    label: 'form.builder.settings.multipleChoice.range'
  }
]

const BADGE_OPTIONS = [
  {
    value: ChoiceBadgeEnum.LETTER,
    label: 'form.builder.settings.multipleChoice.badge.letter'
  },
  {
    value: ChoiceBadgeEnum.NUMBER,
    label: 'form.builder.settings.multipleChoice.badge.number'
  }
]

function getRangeType(value?: Validation) {
  if (
    helper.isEmpty(value) ||
    (helper.isEmpty(value!.min) && helper.isEmpty(value!.max)) ||
    value!.max === 0
  ) {
    return RangeTypeEnum.UNLIMITED
  }

  if (value!.min && value!.min > 0 && value!.min === value!.max) {
    return RangeTypeEnum.EXACT_NUMBER
  }

  return RangeTypeEnum.RANGE
}

const Range: FC<RangeProps> = ({ value, min, max, onChange }) => {
  const [rangeType, setRangeType] = useState(getRangeType(value))
  const [minValue, setMinValue] = useState(value?.min ?? min)

  function handleSelectChange(newRangeType: RangeTypeEnum) {
    if (newRangeType === RangeTypeEnum.UNLIMITED) {
      onChange?.({
        min: undefined,
        max: undefined
      })
    }

    setRangeType(newRangeType)
  }

  const handleExactNumberChange = useCallback(
    (newValue: number) => {
      onChange?.({
        min: newValue,
        max: newValue
      })
    },
    [onChange]
  )

  const handleMinChange = useCallback(
    (newValue: number) => {
      setMinValue(newValue)
      onChange?.({
        min: newValue,
        max: value?.max
      })
    },
    [onChange, value?.max]
  )

  const handleMaxChange = useCallback(
    (newValue: number) => {
      onChange?.({
        min: value?.min,
        max: newValue
      })
    },
    [onChange, value?.min]
  )

  const children = useMemo(() => {
    switch (rangeType) {
      case RangeTypeEnum.EXACT_NUMBER:
        return (
          <Input
            type="number"
            min={min}
            max={max}
            value={value?.max}
            placeholder={`${min} - ${max}`}
            onChange={handleExactNumberChange}
          />
        )

      case RangeTypeEnum.RANGE:
        return (
          <div className="flex items-center gap-x-2">
            <Input
              className="flex-1"
              type="number"
              min={min}
              max={max}
              value={value?.min}
              placeholder={`${min} - ${max}`}
              onChange={handleMinChange}
            />
            <Input
              className="flex-1"
              type="number"
              min={minValue}
              max={max}
              value={value?.max}
              placeholder={`${minValue} - ${max}`}
              onChange={handleMaxChange}
            />
          </div>
        )

      default:
        return null
    }
  }, [
    max,
    min,
    minValue,
    rangeType,
    value?.max,
    value?.min,
    handleExactNumberChange,
    handleMaxChange,
    handleMinChange
  ])

  return (
    <>
      <Select
        className="w-full"
        type="number"
        value={rangeType}
        options={RANGE_OPTIONS}
        multiLanguage
        onChange={handleSelectChange}
      />
      {children}
    </>
  )
}

export default function MultipleChoiceSettings({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  const handleChange = useCallback(
    (key: string, value: any) => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            properties: {
              ...field.properties,
              [key]: value
            }
          }
        }
      })
    },
    [dispatch, field.id, field.properties]
  )

  const handleValidationsChange = useCallback(
    (validations: Validation) => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            validations: {
              ...field.validations,
              ...validations
            }
          }
        }
      })
    },
    [dispatch, field.id, field.validations]
  )

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm/6" htmlFor="#">
            {t('form.builder.settings.multipleSelection')}
          </label>
          <Switch
            value={field.properties?.allowMultiple}
            onChange={value => handleChange('allowMultiple', value)}
          />
        </div>

        {field.properties?.allowMultiple && (
          <Range
            min={0}
            max={field.properties?.choices?.length || 1}
            value={field.validations}
            onChange={handleValidationsChange}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.randomize')}
        </label>
        <Switch
          value={field.properties?.randomize}
          onChange={value => handleChange('randomize', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.allowOther')}
        </label>
        <Switch
          value={field.properties?.allowOther}
          onChange={value => handleChange('allowOther', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.multipleChoice.verticalAlignment')}
        </label>
        <Switch
          value={!helper.isFalse(field.properties?.verticalAlignment)}
          onChange={value => handleChange('verticalAlignment', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.multipleChoice.badge.title')}
        </label>
        <Select
          value={field.properties?.badge || ChoiceBadgeEnum.LETTER}
          options={BADGE_OPTIONS}
          multiLanguage
          onChange={value => handleChange('badge', value)}
        />
      </div>
    </>
  )
}
