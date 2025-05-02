import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import { FC, useCallback, useMemo, useState } from 'react'

import { KeyCode } from '@/components'
import type { IComponentProps } from '@/components'
import { useTranslation } from '@/pages/form/views/FormComponents'

import type { ChoiceRadioOption } from './ChoiceRadio'
import { ChoiceRadio } from './ChoiceRadio'

interface ChoiceRadioGroupProps extends Omit<IComponentProps, 'onChange'> {
  options: ChoiceRadioOption[]
  allowMultiple?: boolean
  allowOther?: boolean
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
    () => max > 0 && values.length + (allowOther ? 1 : 0) >= max,
    [allowOther, max, values.length]
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
          newValues = values.filter(v => v !== value)
        } else {
          newValues = isDisabled ? values : [...values, value]
        }
      }

      onChange?.({
        value: newValues,
        other: otherValue
      })
    },
    [allowMultiple, isDisabled, otherValue, values]
  )

  const handleOtherChange = useCallback(
    (newOtherValue: string) => {
      onChange?.({
        value: values,
        other: newOtherValue
      })
    },
    [values]
  )

  const handleOtherClick = useCallback(() => {
    setIsOtherSelected(!isOtherSelected)

    if (!isOtherSelected && !allowMultiple) {
      onChange?.({
        value: [],
        other: otherValue
      })
    }
  }, [isOtherSelected, allowMultiple, otherValue])

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
          keyName={String.fromCharCode(KeyCode.A + options.length)}
          enableImage={enableImage}
          label={t('Other')}
          value={otherValue}
          isHotkeyShow={isHotkeyShow}
          isChecked={isOtherSelected}
          isOther={true}
          onClick={handleOtherClick}
          onChange={handleOtherChange}
        />
      )}
    </div>
  )
}
