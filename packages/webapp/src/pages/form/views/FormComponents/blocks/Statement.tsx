import type { FC } from 'react'

import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const Statement: FC<BlockProps> = ({ field, ...restProps }) => {
  return (
    <Block className="heyform-statement heyform-empty-state" field={field} {...restProps}>
      <Form field={field} />
    </Block>
  )
}
