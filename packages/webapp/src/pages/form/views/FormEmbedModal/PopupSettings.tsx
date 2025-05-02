import { observer } from 'mobx-react-lite'

import { Input, Select } from '@/components'
import { useStore } from '@/store'
import { useTranslation } from 'react-i18next'

import { ModalSettings } from './ModalSettings'

export const PopupSettings = observer(() => {
  const formStore = useStore('formStore')
	const { t } = useTranslation()

	const POSITION_OPTIONS = [
		{ value: 'bottom-left', label: t('share.bottomLeftCorner') },
		{ value: 'bottom-right', label: t('share.bottomRightCorner') }
	]
  function handleChange(updates: any) {
    formStore.updateEmbedConfig(updates)
  }

  return (
    <ModalSettings>
      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">{t('share.position')}</div>
        <Select
          options={POSITION_OPTIONS}
          value={formStore.currentEmbedConfig.position}
          onChange={position => handleChange({ position })}
        />
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">{t('share.width')}</div>
        <Input
          trailing={<span className="text-slate-500">px</span>}
          type="number"
          min={0}
          value={formStore.currentEmbedConfig.width}
          onChange={width => handleChange({ width })}
        />
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">{t('share.height')}</div>
        <Input
          trailing={<span className="text-slate-500">px</span>}
          type="number"
          min={0}
          value={formStore.currentEmbedConfig.height}
          onChange={height => handleChange({ height })}
        />
      </div>
    </ModalSettings>
  )
})
