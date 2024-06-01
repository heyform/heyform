import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect } from 'react'

import { useStore } from '../store'
import { WelcomeBranding } from '../views/Branding'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const ThankYou: FC<BlockProps> = ({ field, className, children, ...restProps }) => {
  const { state } = useStore()

  useEffect(() => {
    if (
      state.customUrlRedirects &&
      field.properties?.redirectOnCompletion &&
      field.properties?.redirectUrl
    ) {
      window.location.href = field.properties.redirectUrl
    }
  }, [])

  return (
    <>
      <Block
        className={clsx('heyform-empty-state heyform-thank-you', className)}
        field={field}
        isScrollable={false}
        {...restProps}
      />
      <WelcomeBranding />
    </>
  )
}
