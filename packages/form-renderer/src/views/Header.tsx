import type { FC } from 'react'
import { useCallback } from 'react'

import { sendMessageToParent } from '../utils'
import { resolveEnding } from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'

import { Countdown } from '../components/Countdown'
import { useStore } from '../store'
import { Progress } from './Progress'

export const Header: FC = () => {
  const { state, dispatch } = useStore()

  async function handleCountdownEnd() {
    const ending = resolveEnding(
      [...state.allFields, ...state.thankYouFields],
      state.logics,
      state.parameters,
      state.values,
      true
    )
    const isDiscarded = !!ending?.properties?.discardSubmission

    // An ending that keeps its responses out of the form still has something to tell the
    // respondent, so it neither submits nor closes the embed
    if (!isDiscarded) {
      await state.onSubmit?.(state.values, true)

      if (helper.isTrue(state.query.hideAfterSubmit)) {
        sendMessageToParent('HIDE_EMBED_MODAL')
      }
    }

    dispatch({
      type: 'setIsSubmitted',
      payload: {
        isSubmitted: true,
        thankYouFieldId: isDiscarded ? ending!.id : undefined
      }
    })
  }

  const handleCountdownEndCallback = useCallback(handleCountdownEnd, [state.values])

  return (
    <div className="heyform-header">
      <div className="heyform-header-wrapper">
        <div className="heyform-header-left">
          {state.logo && (
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
