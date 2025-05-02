import clsx from 'clsx'
import type { FC, ReactNode } from 'react'

import { Spin } from '@/components'

interface SubmitProps {
  className?: string
  visible?: boolean
  text?: string
  icon?: ReactNode
  helper?: ReactNode
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const Submit: FC<SubmitProps> = ({
  className,
  text = 'Next',
  icon,
  helper,
  loading,
  disabled,
  onClick
}) => {
  return (
    <div className={clsx('heyform-submit-container', className)}>
      <button
        className={clsx('heyform-submit-button', {
          'heyform-justify-between': !!icon
        })}
        type="submit"
        disabled={disabled}
        onClick={onClick}
      >
        {loading && <Spin />}
        <span>{text}</span>
        {icon}
      </button>
      {helper}
    </div>
  )
}
