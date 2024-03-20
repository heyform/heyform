import clsx from 'clsx'
import type { FC, ReactNode } from 'react'

import { IComponentProps } from '../typing'

export interface HeadingProps extends Omit<IComponentProps, 'title'> {
  title?: ReactNode
  icon?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

const Heading: FC<HeadingProps> = ({
  className,
  title,
  icon,
  description,
  actions,
  ...restProps
}) => {
  return (
    <div className={clsx('heading', className)} {...restProps}>
      <div className="heading-left heading-flex-auto">
        {icon && <div className="heading-icon">{icon}</div>}
        <div className="heading-flex-auto">
          <h2 className="heading-title">{title}</h2>
          {description && <div className="heading-description">{description}</div>}
        </div>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  )
}

export default Heading
