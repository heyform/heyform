import type { FC } from 'react'

import type { InputProps } from './Input'
import Input from './Input'
import type { InputPasswordProps } from './Password'
import Password from './Password'
import type { InputSearchProps } from './Search'
import Search from './Search'
import type { TextareaProps } from './Textarea'
import Textarea from './Textarea'

type ExportInputType = FC<InputProps> & {
  Password: FC<InputPasswordProps>
  Textarea: FC<TextareaProps>
  Search: FC<InputSearchProps>
}

const ExportInput = Input as ExportInputType

ExportInput.Password = Password
ExportInput.Textarea = Textarea
ExportInput.Search = Search

export default ExportInput
