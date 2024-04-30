import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'

import { Select } from '@/components/ui'
import { useStore } from '@/store'

import { FullpageSettings } from './FullpageSettings'
import { WidthInput } from './WidthInput'

const HEIGHT_OPTIONS = [
  {
    label: 'Auto',
    value: true
  },
  {
    label: 'Fixed',
    value: false
  }
]

export const StandardSettings = observer(() => {
  const formStore = useStore('formStore')

  function handleChange(autoResizeHeight: any) {
    formStore.updateEmbedConfig({
      autoResizeHeight: helper.isTrue(autoResizeHeight)
    })
  }

  return (
    <FullpageSettings>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">Width</div>
        <WidthInput typeKey="widthType" inputKey="width" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">Height</div>
          <Select
            className="!w-[150px]"
            options={HEIGHT_OPTIONS}
            value={formStore.currentEmbedConfig.autoResizeHeight}
            onChange={handleChange}
          />
        </div>

        {!formStore.currentEmbedConfig.autoResizeHeight && (
          <div className="mt-2 flex justify-end">
            <WidthInput typeKey="heightType" inputKey="height" />
          </div>
        )}
      </div>
    </FullpageSettings>
  )
})
