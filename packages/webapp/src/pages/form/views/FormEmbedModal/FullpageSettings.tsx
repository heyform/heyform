import { observer } from 'mobx-react-lite'
import { FC } from 'react'

import { Switch } from '@/components/ui'
import { useStore } from '@/store'

export const FullpageSettings: FC<IComponentProps> = observer(({ children }) => {
  const formStore = useStore('formStore')

  function handleChange(transparentBackground: boolean) {
    formStore.updateEmbedConfig({
      transparentBackground
    })
  }

  return (
    <>
      {children}

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">Transparent background</div>
        <Switch
          size="small"
          value={formStore.currentEmbedConfig.transparentBackground}
          onChange={handleChange}
        />
      </div>
    </>
  )
})
