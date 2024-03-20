import clsx from 'clsx'
import type { FC } from 'react'
import { MouseEvent, ReactNode } from 'react'

import { IComponentProps } from '../typing'

export interface MenuLabelProps extends Omit<IComponentProps, 'onClick'> {
  icon?: ReactNode
  label: ReactNode
  onClick?: (event?: MouseEvent<HTMLDivElement>) => void
}

const MenuLabel: FC<MenuLabelProps> = ({ className, icon, label, onClick, ...restProps }) => {
  return (
    <div className={clsx('menu-label', className)} role="none" onClick={onClick} {...restProps}>
      {icon}
      {label}
    </div>
  )
}

export default MenuLabel
