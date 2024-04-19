import type { FC } from 'react'

import { questionNumber } from '@/pages/form/views/FormComponents'

import type { FieldIconProps } from '../FieldIcon'
import { FieldIcon } from '../FieldIcon'

interface FieldKindIconProps extends FieldIconProps {
  parentIndex?: number
}

export const FieldKindIcon: FC<FieldKindIconProps> = ({ parentIndex, index, ...restProps }) => {
  return (
    <FieldIcon
      className="field-card-icon"
      index={questionNumber(index, parentIndex)}
      iconOnly={false}
      {...restProps}
    />
  )
}
