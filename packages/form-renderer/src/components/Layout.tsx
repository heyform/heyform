import type { Layout as FormLayout } from '@heyform-inc/shared-types-enums'
import { deepEqual, helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { memo } from 'react'

function filterStyle(brightness?: number) {
  if (!brightness) {
    return undefined
  }

  const value = 1 + brightness / 100

  if (value < 0) {
    return {
      filter: `brightness(${value})`
    }
  }

  return {
    filter: `contrast(${2 - value}) brightness(${value})`
  }
}

const LayoutComponent: FC<FormLayout> = props => {
  if (helper.isEmpty(props) || !helper.isURL(props!.mediaUrl)) {
    return null
  }

  return (
    <div className={`heyform-layout heyform-layout-${props!.align}`}>
      <img
        src={props!.mediaUrl}
        style={filterStyle(props!.brightness)}
        alt="HeyForm layout image"
      />
    </div>
  )
}

export const Layout = memo(LayoutComponent, deepEqual)
