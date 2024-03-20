import type { FormField } from '@heyform-inc/shared-types-enums'
import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect } from 'react'

import { useStore } from '../store'
import { replaceHTML } from '../utils'
import { Branding } from '../views/Branding'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const ThankYou: FC<BlockProps> = ({ field, className, children, ...restProps }) => {
  const { state } = useStore()
  const { values, fields, variables } = state

  const newField: FormField = {
    ...field,
    title: replaceHTML(field.title as string, values, fields, variables),
    description: replaceHTML(field.description as string, values, fields, variables)
  }

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
        field={newField}
        isScrollable={false}
        {...restProps}
      />
      <Branding />
    </>
  )
}
