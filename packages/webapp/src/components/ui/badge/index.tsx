import clsx from 'clsx'
import type { FC } from 'react'

import { IComponentProps } from '../typing'

export interface BadgeProps extends IComponentProps {
  type?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink'
  rounded?: boolean
  dot?: boolean
  text?: string
}

const Badge: FC<BadgeProps> = ({ className, type = 'gray', rounded, dot, text, ...restProps }) => {
  return (
    <span
      className={clsx(
        'badge',
        {
          'badge-rounded': rounded,
          [`badge-${type}`]: type
        },
        className
      )}
      {...restProps}
    >
      {dot && (
        <svg className="badge-dot" fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}
      {text}
    </span>
  )
}

export default Badge
