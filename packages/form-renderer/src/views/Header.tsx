import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { useCallback } from 'react'

import { Countdown } from '../components/Countdown'
import { useStore } from '../store'
import { sendMessageToParent } from '../utils'
import { Progress } from './Progress'

export const Header: FC = () => {
  const { state, dispatch } = useStore()

  async function handleCountdownEnd() {
    // Submit form
    await state.onSubmit?.(state.values, true)

    if (helper.isTrue(state.query.hideAfterSubmit)) {
      sendMessageToParent('HIDE_EMBED_MODAL')
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
        <div className="heyform-header-left">
          {(state.settings as any)?.whitelabelBranding && state.logo && (
            <div className="heyform-logo">
              <img src={state.logo} alt="" />
            </div>
          )}
        </div>

        <div className="heyform-header-right">
          {state.settings?.enableTimeLimit && state.settings.timeLimit && (
            <Countdown settings={state.settings!} onEnd={handleCountdownEndCallback} />
          )}
          {state.settings?.enableProgress && <Progress />}
        </div>
      </div>
    </div>
  )
}
