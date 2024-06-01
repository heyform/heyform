import clsx from 'clsx'
import type { FC, ReactNode } from 'react'

import { Loader } from './Loader'

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
        className="heyform-submit-button"
        type="submit"
        disabled={disabled}
        onClick={onClick}
      >
        {loading && <div className="absolute inset-0 flex items-center justify-center"><Loader /></div>}
        <div className={clsx('w-full flex items-center justify-center', {
          'justify-between': !!icon,
          'opacity-0': loading
        })}>
          <span>{text}</span>
          {icon}
        </div>
      </button>
      {helper}
    </div>
  )
}
