import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import type { FC } from 'react'
import { useCallback, useMemo, useState } from 'react'

import { IComponentProps } from '../typings'
import type { RadioOption } from './Radio'
import { Radio } from './Radio'

interface RadioGroupProps extends Omit<IComponentProps, 'onChange'> {
  options: RadioOption[]
  allowMultiple?: boolean
  isHotkeyShow?: boolean
  max?: number
  enableImage?: boolean
  value?: any
  onChange?: (values: any[]) => void
}

function resetArray(arr: any) {
  return (helper.isArray(arr) ? arr : [arr]).filter(helper.isValid)
}

export const RadioGroup: FC<RadioGroupProps> = ({
  className,
  options,
  allowMultiple = false,
  isHotkeyShow = true,
  max = 0,
  enableImage,
  value: rawValue,
  onChange,
  ...restProps
}) => {
  const [values, setValues] = useState<any[]>(resetArray(rawValue))
  const isDisabled = useMemo(() => max > 0 && values.length >= max, [values, max])

  function handleClick(value: any) {
    let newValues: any[]

    if (!allowMultiple) {
      newValues = [value]
    } else {
      if (values.includes(value)) {
        newValues = values.filter(v => v !== value)
      } else {
        newValues = isDisabled ? values : [...values, value]
      }
    }

    setValues(newValues)
    onChange?.(newValues)
  }

  const handleClickCallback = useCallback(handleClick, [values, isDisabled])

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
        <Radio
          key={option.value as string}
          {...option}
          enableImage={enableImage}
          isHotkeyShow={isHotkeyShow}
          isChecked={values.includes(option.value)}
          onClick={handleClickCallback}
        />
      ))}
    </div>
  )
}
