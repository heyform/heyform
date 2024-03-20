import type { FC } from 'react'

import { Rules } from './Rules'
import { Variables } from './Variables'

export const Logic: FC = () => {
  return (
    <div>
      <Variables />
      <Rules />
    </div>
  )
}
