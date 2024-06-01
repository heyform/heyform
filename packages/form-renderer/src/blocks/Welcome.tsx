import type { FormField } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'

import { useStore } from '../store'
import { replaceHTML } from '../utils'
import { WelcomeBranding } from '../views/Branding'
import type { BlockProps } from './Block'
import { EmptyState } from './EmptyState'

export const Welcome: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state, dispatch } = useStore()
  const { values, fields, query, variables } = state

  const newField: FormField = {
    ...field,
    title: replaceHTML(field.title as string, values, fields, query, variables),
    description: replaceHTML(field.description as string, values, fields, query, variables)
  }

  function handleClick() {
    dispatch({
      type: 'setIsStarted',
      payload: {
        isStarted: true
      }
    })
  }

  return (
    <>
      <EmptyState
        {...restProps}
        className="heyform-welcome"
        field={newField}
        onClick={handleClick}
      />
      <WelcomeBranding />
    </>
  )
}
