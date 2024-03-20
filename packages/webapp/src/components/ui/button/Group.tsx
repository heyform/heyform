import clsx from 'clsx'
import type { FC } from 'react'

import { IComponentProps } from '../typing'

export type ButtonGroupProps = IComponentProps

const Group: FC<ButtonGroupProps> = ({ className, children, ...restProps }) => {
  return (
    <span className={clsx('button-group', className)} {...restProps}>
      {children}
    </span>
  )
}

export default Group
