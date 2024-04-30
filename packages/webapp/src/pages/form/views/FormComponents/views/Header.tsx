import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { useCallback } from 'react'

import { Countdown } from '../components/Countdown'
import { useStore } from '../store'
import { sendHideModalMessage } from '../utils'
import { Progress } from './Progress'

export const Header: FC = () => {
  const { state, dispatch } = useStore()

  async function handleCountdownEnd() {
    // Submit form
    await state.onSubmit?.(state.values, true)

    if (helper.isTrue(state.query.hideAfterSubmit)) {
      sendHideModalMessage()
    }

    dispatch({
      type: 'setIsSubmitted',
      payload: {
        isSubmitted: true
      }
    })
  }

  const handleCountdownEndCallback = useCallback(handleCountdownEnd, [state.values])

  return (
    <div className="heyform-header">
      <div className="heyform-header-wrapper">
        {state.settings?.enableTimeLimit && state.settings.timeLimit && (
          <Countdown settings={state.settings!} onEnd={handleCountdownEndCallback} />
        )}
        {state.settings?.enableProgress && <Progress />}
      </div>
    </div>
  )
}
