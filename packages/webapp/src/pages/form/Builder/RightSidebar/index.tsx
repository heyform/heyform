import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@/components'

import { useStoreContext } from '../store'
import Design from './Design'
import { Logic } from './Logic'
import Question from './Question'

export default function BuilderRightSidebar() {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  const tabs = useMemo(
    () => [
      {
        value: 'question',
        label: t('form.builder.question.title'),
        content: <Question />
      },
      {
        value: 'design',
        label: t('form.builder.design.title'),
        content: <Design />
      },
      {
        value: 'logic',
        label: t('form.builder.logic.title'),
        content: <Logic />
      }
    ],
    [t]
  )

  function handleChange(activeTabName: string) {
    dispatch({
      type: 'setActiveTabName',
      payload: {
        activeTabName
      }
    })
  }

  return (
    <div className="h-full w-[20rem] max-lg:hidden lg:rounded-lg lg:bg-foreground lg:shadow-sm lg:ring-1 lg:ring-primary/5">
      <Tabs
        className="[&_[data-slot=content]]:scrollbar flex h-full flex-col [&_[data-slot=content]]:flex-1"
        tabs={tabs}
        defaultTab="question"
        onChange={handleChange}
      />
    </div>
  )
}
