import clsx from 'clsx'
import type { FC } from 'react'

import type { IComponentProps } from '@/components/ui/typing'

export interface FlagIconProps extends IComponentProps {
  countryCode?: string
}

export const FlagIcon: FC<FlagIconProps> = ({ className, countryCode = 'US' }) => {
  return <span className={clsx(`fi fi-${countryCode?.toLowerCase()}`, className)} />
}
