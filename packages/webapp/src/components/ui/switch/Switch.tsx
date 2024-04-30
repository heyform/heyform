import clsx from 'clsx'
import type { FC } from 'react'

import Spin from '../spin'
import { IComponentProps } from '../typing'

export interface SwitchProps extends Omit<IComponentProps, 'onChange'> {
  loading?: boolean
  size?: 'small' | 'normal'
  disabled?: boolean
  value?: boolean
  onChange?: (value: boolean) => void
}

const Switch: FC<SwitchProps> = ({
  className,
  value = false,
  size = 'normal',
  loading = false,
  disabled,
  onChange,
  ...restProps
}) => {
  function handleClick() {
    onChange?.(!value)
  }

  return (
    <button
      className={clsx(
        'switch',
        `switch-${size}`,
        {
          'switch-checked': value
        },
        className
      )}
      role="switch"
      type="button"
      tabIndex={0}
      aria-checked={value}
      disabled={loading || disabled}
      onClick={handleClick}
      {...restProps}
    >
      <span className="switch-handle" aria-hidden="true">
        {loading && <Spin />}
      </span>
    </button>
  )
}

export default Switch
