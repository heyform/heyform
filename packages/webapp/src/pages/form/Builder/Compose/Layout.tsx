import type { Layout as FormLayout } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'

import { cn } from '@/utils'

interface LayoutProps extends ComponentProps {
  layout?: FormLayout
}

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

export const Layout: FC<LayoutProps> = ({ className, layout, ...restProps }) => {
  if (!helper.isURL(layout?.mediaUrl)) {
    return null
  }

  return (
    <div className={cn('heyform-layout', className)} {...restProps}>
      <img src={layout!.mediaUrl} style={filterStyle(layout?.brightness)} />
    </div>
  )
}
