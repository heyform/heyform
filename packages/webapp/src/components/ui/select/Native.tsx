import type { Placement as PopperPlacement } from '@popperjs/core/lib/enums'
import clsx from 'clsx'
import type { ChangeEvent, FC, HTMLInputTypeAttribute } from 'react'

import { IComponentProps, IOptionGroupType, IOptionType } from '../typing'

export interface SelectProps extends Omit<IComponentProps, 'value' | 'onChange'> {
  popupClassName?: string
  placement?: PopperPlacement
  autoWidth?: boolean
  options?: IOptionType[] | IOptionGroupType[]
  labelKey?: keyof IOptionType
  valueKey?: keyof IOptionType
  value?: any
  native?: boolean
  nativeLike?: boolean
  allowInput?: boolean
  alwaysInput?: boolean
  inputHTMLType?: HTMLInputTypeAttribute
  allowClear?: boolean
  isHasError?: boolean
  loading?: boolean
  disabled?: boolean
  unmountOnExit?: boolean
  valueRender?: (option?: IOptionType) => JSX.Element
  placeholder?: string
  optionRender?: (option: IOptionType, isActive?: boolean) => JSX.Element
  onDropdownVisibleChange?: (isVisible: boolean) => void
  onChange?: (value: any) => void
}

const Native: FC<SelectProps> = ({
  className,
  options = [],
  labelKey = 'label',
  valueKey = 'value',
  value,
  autoWidth,
  isHasError,
  placeholder,
  onChange,
  ...restProps
}) => {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange?.(event.target.value)
  }

  return (
    <select
      value={value as unknown as string}
      className={clsx(
        'select select-native',
        {
          'select-error': isHasError,
          'select-auto-width': autoWidth
        },
        className
      )}
      tabIndex={0}
      onChange={handleChange}
      {...restProps}
    >
      {options.map((option: any) => (
        <option key={option[valueKey] as string} value={option[valueKey] as string}>
          {option[labelKey]}
        </option>
      ))}
    </select>
  )
}

export default Native
