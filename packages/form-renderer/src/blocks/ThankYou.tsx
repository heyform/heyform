import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect } from 'react'

import { useStore } from '../store'
import { isURL } from '../utils'
import { WelcomeBranding } from '../views/Branding'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const ThankYou: FC<BlockProps> = ({ field, className, children, ...restProps }) => {
  const { state } = useStore()

  useEffect(() => {
    let redirectUrl = field.properties?.redirectUrl

    if (state.customUrlRedirects && field.properties?.redirectOnCompletion && redirectUrl) {
      const delay = (field.properties?.redirectDelay || 0) * 1_000

      if (!isURL(redirectUrl)) {
        redirectUrl = 'https://' + redirectUrl
      }

      setTimeout(() => {
        window.location.href = redirectUrl as string
      }, delay)
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
