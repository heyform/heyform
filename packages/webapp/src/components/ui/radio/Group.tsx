import clsx from 'clsx'
import type { FC } from 'react'
import { useCallback } from 'react'

import { IComponentProps, IOptionType } from '../typing'
import Radio from './Radio'

export interface RadioGroupProps extends Omit<IComponentProps, 'value' | 'onChange'> {
  value?: any
  options?: IOptionType[]
  disabled?: boolean
  onChange?: (value: any) => void
}

const Group: FC<RadioGroupProps> = ({
  className,
  value,
  options,
  disabled,
  onChange,
  ...restProps
}) => {
  function handleChange(checked: boolean, optionValue?: any) {
    if (onChange && checked) {
      onChange(optionValue!)
    }
  }

  const handleChangeCallback = useCallback(handleChange, [])

  return (
    <div className={clsx('radio-group', className)} {...restProps}>
      {options?.map(option => (
        <Radio
          key={option.value.toString()}
          value={option.value}
          checked={value === option.value}
          disabled={'disabled' in option ? option.disabled : disabled}
          onChange={handleChangeCallback}
        >
          {option.label}
        </Radio>
      ))}
    </div>
  )
}

export default Group
