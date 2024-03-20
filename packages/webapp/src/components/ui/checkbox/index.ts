import type { FC } from 'react'

import type { CheckboxProps } from './Checkbox'
import Checkbox from './Checkbox'
import type { CheckboxGroupProps } from './Group'
import Group from './Group'

type ExportCheckboxType = FC<CheckboxProps> & {
  Group: FC<CheckboxGroupProps>
}

const ExportCheckbox = Checkbox as ExportCheckboxType
ExportCheckbox.Group = Group

export default ExportCheckbox
