import type { FC } from 'react'

interface FlagIconProps {
  countryCode?: string
}

export const FlagIcon: FC<FlagIconProps> = ({ countryCode = 'US' }) => {
  return <span className={`flag-icon flag-icon-${countryCode?.toLowerCase()}`} />
}
