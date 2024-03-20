import clsx from 'clsx'
import type { FC, ReactNode } from 'react'

import { IComponentProps } from '../typing'

export interface EmptyStatesProps extends IComponentProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
}

const EmptyStates: FC<EmptyStatesProps> = ({
  className,
  icon,
  title,
  description,
  action,
  ...restProps
}) => {
  return (
    <div className={clsx('empty-states', className)} {...restProps}>
      {icon && <div className="empty-states-icon">{icon}</div>}
      <h3 className="empty-states-title">{title}</h3>
      {description && <div className="empty-states-description">{description}</div>}
      {action && <div className="empty-states-action">{action}</div>}
    </div>
  )
}

export default EmptyStates
