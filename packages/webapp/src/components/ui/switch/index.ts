import type { FC } from 'react'

import type { SwitchGroupProps } from './Group'
import Group from './Group'
import type { SwitchProps } from './Switch'
import Switch from './Switch'

type ExportCheckboxType = FC<SwitchProps> & {
  Group: FC<SwitchGroupProps>
}

const ExportSwitch = Switch as ExportCheckboxType
ExportSwitch.Group = Group

export default ExportSwitch
