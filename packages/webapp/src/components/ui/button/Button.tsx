import clsx from 'clsx'
import type { ButtonHTMLAttributes, FC, ReactNode } from 'react'

import Loader from '../loader'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'value' | 'onChange'> {
  type?: 'primary' | 'danger' | 'success'
  htmlType?: 'button' | 'submit' | 'reset'
  leading?: ReactNode
  trailing?: ReactNode
  block?: boolean
  rounded?: boolean
  loading?: boolean
  loaderClassName?: string
}

const Button: FC<ButtonProps> = ({
  type,
  htmlType = 'button',
  leading,
  trailing,
  loading,
  block,
  rounded,
  disabled,
  children,
  className,
  loaderClassName,
  ...restProps
}) => {
  return (
    <button
      type={htmlType}
      className={clsx(
        'button',
        {
          [`button-${type}`]: type,
          'button-block': block,
          'button-rounded': rounded,
          'button-icon-only': !children && leading,
          'button-loading': loading
        },
        className
      )}
      disabled={loading || disabled}
      {...restProps}
    >
      {leading && <span className="button-leading">{leading}</span>}
      {children && <span className="button-content">{children}</span>}
      {trailing && <span className="button-trailing">{trailing}</span>}
      {loading && (
        <span className={clsx('button-loader', loaderClassName)}>
          <Loader />
        </span>
      )}
    </button>
  )
}

export default Button
