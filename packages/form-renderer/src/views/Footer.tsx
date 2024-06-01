import { IconChevronDown, IconChevronUp, IconLayoutGrid } from '@tabler/icons-react'
import type { FC } from 'react'

import { Button, Tooltip } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import { Branding } from './Branding'

export const Footer: FC = () => {
  const { state, dispatch } = useStore()
  const { t } = useTranslation()

  function handlePrevious() {
    dispatch({ type: 'scrollPrevious' })
  }

  function handleNext() {
    dispatch({ type: 'scrollNext' })
  }

  function handleToggleSidebar() {
    dispatch({
      type: 'setIsSidebarOpen',
      payload: {
        isSidebarOpen: !state.isSidebarOpen
      }
    })
  }

  return (
    <div className="heyform-footer">
      <div className="heyform-footer-wrapper">
        <div className="heyform-footer-left"></div>

        <div className="heyform-footer-right">
          <div className="heyform-pagination">
            {state.enableQuestionList && (
              <Tooltip ariaLabel={t('Questions')}>
                <Button.Link
                  className="heyform-sidebar-toggle"
                  trailing={<IconLayoutGrid />}
                  onClick={handleToggleSidebar}
                />
              </Tooltip>
            )}

            {state.enableNavigationArrows && (
              <>
                <Tooltip ariaLabel={t('Previous question')}>
                  <Button.Link
                    className="heyform-pagination-previous"
                    trailing={<IconChevronUp />}
                    disabled={state.scrollIndex! < 1}
                    onClick={handlePrevious}
                  />
                </Tooltip>

                <Tooltip ariaLabel={t('Next question')}>
                  <Button.Link
                    className="heyform-pagination-next"
                    trailing={<IconChevronDown />}
                    disabled={
                      state.isScrollNextDisabled || state.scrollIndex! >= state.fields.length - 1
                    }
                    onClick={handleNext}
                  />
                </Tooltip>
              </>
            )}
          </div>

          <Branding />
        </div>
      </div>
    </div>
  )
}
