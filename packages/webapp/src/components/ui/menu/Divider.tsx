import clsx from 'clsx'
import type { FC } from 'react'

import { IComponentProps } from '../typing'

const MenuDivider: FC<IComponentProps<HTMLDivElement>> = ({ className, ...restProps }) => {
  return <div className={clsx('menu-divider', className)} role="none" {...restProps} />
}

export default MenuDivider
