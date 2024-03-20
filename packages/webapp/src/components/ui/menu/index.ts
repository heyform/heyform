import type { FC } from 'react'

import { IComponentProps } from '../typing'
import MenuDivider from './Divider'
import type { MenuItemProps } from './Item'
import MenuItem from './Item'
import type { MenuLabelProps } from './Label'
import MenuLabel from './Label'
import type { MenusProps } from './Menus'
import Menus from './Menus'

type ExportMenusType = FC<MenusProps> & {
  Item: FC<MenuItemProps>
  Label: FC<MenuLabelProps>
  Divider: FC<IComponentProps<HTMLDivElement>>
}

const ExportMenus = Menus as unknown as ExportMenusType
ExportMenus.Item = MenuItem
ExportMenus.Label = MenuLabel
ExportMenus.Divider = MenuDivider

export default ExportMenus
