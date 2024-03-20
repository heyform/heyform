import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

import { NumberVariableIcon, StringVariableIcon } from '@/components'
import { type FieldConfig } from '@/pages/form/Create/views/FieldConfig'

export const VARIABLE_KIND_CONFIGS: FieldConfig[] = [
  {
    kind: 'number' as FieldKindEnum,
    icon: NumberVariableIcon,
    label: 'formBuilder.variable.number',
    textColor: '#06a17e',
    backgroundColor: 'rgba(6,161,126,0.05)'
  },
  {
    kind: 'string' as FieldKindEnum,
    icon: StringVariableIcon,
    label: 'formBuilder.variable.string',
    textColor: '#06a17e',
    backgroundColor: 'rgba(6,161,126,0.05)'
  }
]

export const VARIABLE_INPUT_TYPES: any = {
  number: 'number',
  string: 'text'
}
