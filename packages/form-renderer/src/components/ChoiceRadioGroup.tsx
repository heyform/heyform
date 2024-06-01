import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { CHAR_A_KEY_CODE } from '../consts'
import { IComponentProps } from '../typings'
import { useTranslation } from '../utils'
import type { ChoiceRadioOption } from './ChoiceRadio'
import { ChoiceRadio } from './ChoiceRadio'

interface ChoiceRadioGroupProps extends Omit<IComponentProps, 'onChange'> {
  options: ChoiceRadioOption[]
  allowMultiple?: boolean
  allowOther?: boolean
  isOtherFilled?: boolean
  isHotkeyShow?: boolean
  max?: number
  enableImage?: boolean
  value?: any
  onChange?: (value: any) => void
}

function resetArray(arr: any) {
  return (helper.isArray(arr) ? arr : [arr]).filter(helper.isValid)
}

export const ChoiceRadioGroup: FC<ChoiceRadioGroupProps> = ({
  className,
  options,
  allowMultiple = false,
  allowOther = false,
  isOtherFilled = false,
  isHotkeyShow = true,
  max = 0,
  enableImage,
  value: rawValue,
  onChange,
  ...restProps
}) => {
  const { t } = useTranslation()

  const values = useMemo(() => resetArray(rawValue?.value || []), [rawValue])
  const otherValue = useMemo(() => rawValue?.other, [rawValue])

  const isDisabled = useMemo(
    () => max > 0 && values.length + (allowOther && isOtherFilled ? 1 : 0) >= max,
    [allowOther, isOtherFilled, max, values.length]
  )
  const [isOtherSelected, setIsOtherSelected] = useState(false)

  const handleClick = useCallback(
    (value: any) => {
      let newValues: any[]

      if (!allowMultiple) {
        newValues = [value]
        setIsOtherSelected(false)
      } else {
        if (values.includes(value)) {
          newValues = values.filter((v: any) => v !== value)
        } else {
          newValues = isDisabled ? values : [...values, value]
        }
      }

      onChange?.({
        value: newValues,
        other: otherValue
      })
    },
    [allowMultiple, isDisabled, onChange, otherValue, values]
  )

  const handleOtherChange = useCallback(
    (newOtherValue: string) => {
      let other: string | undefined = newOtherValue

      if (helper.isEmpty(other)) {
        other = undefined
        setIsOtherSelected(false)
      }

      onChange?.({
        value: values,
        other
      })
    },
    [onChange, values]
  )

  const handleOtherBlur = useCallback(() => {
    if (helper.isEmpty(otherValue)) {
      setIsOtherSelected(false)
    }
  }, [otherValue])

  const handleOtherClick = useCallback(() => {
    if (isDisabled) {
      return
    }

    setIsOtherSelected(true)

    if (!isOtherSelected && !allowMultiple) {
      onChange?.({
        value: [],
        other: otherValue
      })
    }
  }, [isDisabled, isOtherSelected, allowMultiple, otherValue])

  useEffect(() => {
    if (allowOther) {
      setIsOtherSelected(helper.isValid(otherValue))
    }
  }, [])

  return (
    <div
      className={clsx(
        'heyform-radio-group',
        {
          'heyform-radio-group-disabled': isDisabled
        },
        className
      )}
      {...restProps}
    >
      {options.map(option => (
        <ChoiceRadio
          key={option.value as string}
          {...option}
          enableImage={enableImage}
          isHotkeyShow={isHotkeyShow}
          isChecked={values.includes(option.value)}
          onClick={handleClick}
        />
      ))}

      {allowOther && (
        <ChoiceRadio
          className="heyform-radio-other"
          keyName={String.fromCharCode(CHAR_A_KEY_CODE + options.length)}
          enableImage={enableImage}
          label={t('Other')}
          value={otherValue}
          isHotkeyShow={isHotkeyShow}
          isChecked={isOtherSelected}
          isOther={true}
          onBlur={handleOtherBlur}
          onClick={handleOtherClick}
          onChange={handleOtherChange}
        />
      )}
    </div>
  )
}
