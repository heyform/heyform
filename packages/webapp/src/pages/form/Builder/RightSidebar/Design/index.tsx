import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@/components'

import { useStoreContext } from '../../store'
import Customize from './Customize'
import Theme from './Theme'

export default function Design() {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  const tabs = useMemo(
    () => [
      {
        value: 'theme',
        label: t('form.builder.design.theme.title'),
        content: <Theme />
      },
      {
        value: 'customize',
        label: t('form.builder.design.customize.title'),
        content: <Customize />
      }
    ],
    [t]
  )

  function handleChange(activeDesignTabName: string) {
    dispatch({
      type: 'setActiveDesignTabName',
      payload: {
        activeDesignTabName
      }
    })
  }

  return (
    <Tabs.SegmentedControl
      className="[&_[data-slot=nav]]:mx-4 [&_[data-slot=nav]]:mt-4"
      tabs={tabs}
      defaultTab="theme"
      onChange={handleChange}
    />
  )
}
