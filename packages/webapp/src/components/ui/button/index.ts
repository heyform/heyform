import type { FC } from 'react'

import type { ButtonProps } from './Button'
import Button from './Button'
import type { ButtonGroupProps } from './Group'
import Group from './Group'
import Link from './Link'

type ExportButtonType = FC<ButtonProps> & {
  Group: FC<ButtonGroupProps>
  Link: FC<ButtonProps>
}

const ExportButton = Button as ExportButtonType

ExportButton.Group = Group
ExportButton.Link = Link

export default ExportButton
