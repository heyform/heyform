import type { FC } from 'react'

import type { RadioGroupProps } from './Group'
import Group from './Group'
import type { RadioProps } from './Radio'
import Radio from './Radio'

type ExportRadioType = FC<RadioProps> & {
  Group: FC<RadioGroupProps>
}

const ExportRadio = Radio as ExportRadioType
ExportRadio.Group = Group

export default ExportRadio
