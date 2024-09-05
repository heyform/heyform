import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect } from 'react'

import { useStore } from '../store'
import { Branding } from '../views/Branding'
import type { BlockProps } from './Block'
import { Block } from './Block'

const isURL = (arg: any) => /^https?:\/\//i.test(arg)

export const ThankYou: FC<BlockProps> = ({ field, className, children, ...restProps }) => {
  const { state } = useStore()

  useEffect(() => {
    let redirectUrl = field.properties?.redirectUrl

    if (state.customUrlRedirects && field.properties?.redirectOnCompletion && redirectUrl) {
      if (!isURL(redirectUrl)) {
        redirectUrl = 'https://' + redirectUrl
      }

      window.location.href = redirectUrl
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
    </>
  )
}
