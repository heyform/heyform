import clsx from 'clsx'
import type { FC } from 'react'

import { IComponentProps } from '../typings'

export interface FlagIconProps extends IComponentProps {
  countryCode?: string
}

export const FlagIcon: FC<FlagIconProps> = ({ className, countryCode = 'US' }) => {
  return <span className={clsx(`fi bg-black/10 fi-${countryCode?.toLowerCase()}`, className)} />
}
