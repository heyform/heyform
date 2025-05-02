import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Switch } from '@/components'
import { useStore } from '@/store'

export const FullpageSettings: FC<IComponentProps> = observer(({ children }) => {
  const formStore = useStore('formStore')
	const { t } = useTranslation()

  function handleChange(transparentBackground: boolean) {
    formStore.updateEmbedConfig({
      transparentBackground
    })
  }

  return (
    <>
      {children}

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">{t('share.transparentBackground')}</div>
        <Switch
          size="small"
          value={formStore.currentEmbedConfig.transparentBackground}
          onChange={handleChange}
        />
      </div>
    </>
  )
})
