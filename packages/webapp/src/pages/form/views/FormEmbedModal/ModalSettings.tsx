import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Input, Select, Switch } from '@/components'
import { ColorPickerDropdown } from '@/pages/form/Create/views/RightSidebar/Design/Customize/ColorPickerField'
import { useStore } from '@/store'

import { FullpageSettings } from './FullpageSettings'



export const ModalSettings: FC<IComponentProps> = observer(({ children }) => {
  const formStore = useStore('formStore')
	const { t } = useTranslation()

	const SIZE_OPTIONS = [
		{ value: 'small', label: t('share.small') },
		{ value: 'medium', label: t('share.medium') },
		{ value: 'large', label: t('share.large') }
	]

	const LAUNCH_OPTIONS = [
		{ value: 'click', label: t('share.onButtonClick')},
		{ value: 'load', label: t('share.onPageLoad') },
		{ value: 'delay', label: t('share.afterElapsedTime') },
		{ value: 'exit', label: t('share.onExitIntent') },
		{ value: 'scroll', label: t('share.afterScrolling') }
	]

  function handleChange(updates: any) {
    formStore.updateEmbedConfig(updates)
  }

  const launchChildren = useMemo(() => {
    switch (formStore.currentEmbedConfig.openTrigger) {
      case 'delay':
        return (
          <Input
            className="mt-2"
            trailing={t('share.secondsDelay')}
            type="number"
            min={0}
            value={formStore.currentEmbedConfig.openDelay}
            onChange={openDelay => handleChange({ openDelay })}
          />
        )

      case 'scroll':
        return (
          <Input
            className="mt-2"
            trailing={t('share.pageScrolled')}
            type="number"
            min={0}
            max={100}
            value={formStore.currentEmbedConfig.openScrollPercent}
            onChange={openScrollPercent => handleChange({ openScrollPercent })}
          />
        )

      default:
        return null
    }
  }, [
    formStore.currentEmbedConfig.openDelay,
    formStore.currentEmbedConfig.openScrollPercent,
    formStore.currentEmbedConfig.openTrigger
  ])

  return (
    <FullpageSettings>
      {formStore.embedType === 'modal' && (
        <div>
          <div className="mb-1 text-sm font-medium text-slate-700">{t('share.modalSize')}</div>
          <Select
            options={SIZE_OPTIONS}
            value={formStore.currentEmbedConfig.size}
            onChange={size => handleChange({ size })}
          />
        </div>
      )}

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">{t('share.launch')}</div>
        <Select
          options={LAUNCH_OPTIONS}
          value={formStore.currentEmbedConfig.openTrigger}
          onChange={openTrigger => handleChange({ openTrigger })}
        />
        {launchChildren}
      </div>

      {children}

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">{t('share.triggerBackground')}</div>
        <ColorPickerDropdown
          value={formStore.currentEmbedConfig.triggerBackground}
          onChange={triggerBackground => handleChange({ triggerBackground })}
        />
      </div>

      {formStore.embedType === 'modal' && (
        <div>
          <div className="mb-1 text-sm font-medium text-slate-700">{t('share.triggerText')}</div>
          <Input
            value={formStore.currentEmbedConfig.triggerText}
            maxLength={20}
            onChange={triggerText => handleChange({ triggerText })}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">{t('share.closeOnSubmit')}</div>
          <Switch
            size="small"
            value={formStore.currentEmbedConfig.hideAfterSubmit}
            onChange={hideAfterSubmit => handleChange({ hideAfterSubmit })}
          />
        </div>

        {helper.isTrue(formStore.currentEmbedConfig.hideAfterSubmit) && (
          <Input
            className="mt-2"
            type="number"
            min={0}
            trailing={t('share.secondsDelay')}
            value={formStore.currentEmbedConfig.autoClose}
            onChange={autoClose => handleChange({ autoClose })}
          />
        )}
      </div>
    </FullpageSettings>
  )
})
