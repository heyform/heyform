import type { FC } from 'react'

import { useStore } from '../store'
import { Branding } from '../views/Branding'
import type { BlockProps } from './Block'
import { EmptyState } from './EmptyState'

export const Welcome: FC<BlockProps> = ({ field, ...restProps }) => {
  const { dispatch } = useStore()

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
      <EmptyState {...restProps} className="heyform-welcome" field={field} onClick={handleClick} />
      <Branding />
    </>
  )
}
