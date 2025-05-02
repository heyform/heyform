import { IconChevronDown, IconChevronUp, IconLayoutGrid } from '@tabler/icons-react'
import type { FC } from 'react'

import { Button, Tooltip } from '@/components'

import { useStore } from '../store'
import { useTranslation } from '../utils'
import { Branding } from './Branding'

export const Footer: FC = () => {
  const { state, dispatch } = useStore() as any
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
            {state.settings?.enableQuestionList && (
              <Tooltip aria-label={t('Questions')}>
                <div>
                  <Button variant="link" onClick={handleToggleSidebar}>
                    <IconLayoutGrid />
                  </Button>
                </div>
              </Tooltip>
            )}

            <Tooltip aria-label={t('Previous question')}>
              <div>
                <Button variant="link" disabled={state.scrollIndex! < 1} onClick={handlePrevious}>
                  <IconChevronUp />
                </Button>
              </div>
            </Tooltip>

            <Tooltip aria-label={t('Next question')}>
              <div>
                <Button
                  variant="link"
                  disabled={
                    state.isScrollNextDisabled || state.scrollIndex! >= state.fields.length - 1
                  }
                  onClick={handleNext}
                >
                  <IconChevronDown />
                </Button>
              </div>
            </Tooltip>
          </div>

          <Branding />
        </div>
      </div>
    </div>
  )
}
