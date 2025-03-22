import type { FC } from 'react'

import { HiddenFields } from './HiddenFields'
import { Rules } from './Rules'
import { Variables } from './Variables'

export const Logic: FC = () => {
  return (
    <div className="space-y-4 divide-y divide-accent-light p-4">
      <HiddenFields />
      <Variables />
      <Rules />
    </div>
  )
}
