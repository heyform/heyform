import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect } from 'react'

import type { IComponentProps } from '@/components/ui/typing'

export interface FlagIconProps extends IComponentProps {
  countryCode?: string
}

export const FlagIcon: FC<FlagIconProps> = ({ className, countryCode = 'US' }) => {
  useEffect(() => {
    if (!document.getElementById('flag-icons')) {
      const link = document.createElement('link')

      link.id = 'flag-icons'
      link.rel = 'stylesheet'
      link.href =
        'https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/6.4.4/css/flag-icons.min.css'

      document.head.append(link)
    }
  }, [])

  return <span className={clsx(`fi fi-${countryCode?.toLowerCase()}`, className)} />
}
