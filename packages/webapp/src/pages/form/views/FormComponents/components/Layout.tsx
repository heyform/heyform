import type { Layout as FormLayout } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { deepEqual } from 'fast-equals'
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

const LayoutComponent: FC<FormLayout> = ({ align, mediaUrl, brightness = 0 }) => {
  if (!mediaUrl || !helper.isURL(mediaUrl)) {
    return null
  }

  return (
    <div className={`heyform-layout heyform-layout-${align}`}>
      <img src={mediaUrl} style={filterStyle(brightness)} alt="HeyForm layout image" />
    </div>
  )
}

export const Layout = memo(LayoutComponent, deepEqual)
