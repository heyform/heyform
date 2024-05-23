import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'

import { Select } from '@/components/ui'
import { useStore } from '@/store'
import { useTranslation } from 'react-i18next'

import { FullpageSettings } from './FullpageSettings'
import { WidthInput } from './WidthInput'

export const StandardSettings = observer(() => {
  const formStore = useStore('formStore')
	const { t } = useTranslation()

	const HEIGHT_OPTIONS = [
		{
			label: t('share.auto'),
			value: true
		},
		{
			label: t('share.fixed'),
			value: false
		}
	]

  function handleChange(autoResizeHeight: any) {
    formStore.updateEmbedConfig({
      autoResizeHeight: helper.isTrue(autoResizeHeight)
    })
  }

  return (
    <FullpageSettings>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">{t('share.width')}</div>
        <WidthInput typeKey="widthType" inputKey="width" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">{t('share.height')}</div>
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
