import { observer } from 'mobx-react-lite'

import { Input, Select } from '@/components/ui'
import { useStore } from '@/store'

import { ModalSettings } from './ModalSettings'

const POSITION_OPTIONS = [
  { value: 'bottom-left', label: 'Bottom left corner' },
  { value: 'bottom-right', label: 'Bottom right corner' }
]

export const PopupSettings = observer(() => {
  const formStore = useStore('formStore')

  function handleChange(updates: any) {
    formStore.updateEmbedConfig(updates)
  }

  return (
    <ModalSettings>
      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">Position</div>
        <Select
          options={POSITION_OPTIONS}
          value={formStore.currentEmbedConfig.position}
          onChange={position => handleChange({ position })}
        />
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">Width</div>
        <Input
          trailing={<span className="text-slate-500">px</span>}
          type="number"
          min={0}
          value={formStore.currentEmbedConfig.width}
          onChange={width => handleChange({ width })}
        />
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">Height</div>
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
