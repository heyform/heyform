import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import { FC, useMemo } from 'react'

import { Input, Select, Switch } from '@/components/ui'
import { ColorPickerDropdown } from '@/pages/form/Create/views/RightSidebar/Design/Customize/ColorPickerField'
import { useStore } from '@/store'

import { FullpageSettings } from './FullpageSettings'

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }
]

const LAUNCH_OPTIONS = [
  { value: 'click', label: 'On button click' },
  { value: 'load', label: 'On page load' },
  { value: 'delay', label: 'After elapsed time' },
  { value: 'exit', label: 'On exit intent' },
  { value: 'scroll', label: 'After scrolling' }
]

export const ModalSettings: FC<IComponentProps> = observer(({ children }) => {
  const formStore = useStore('formStore')

  function handleChange(updates: any) {
    formStore.updateEmbedConfig(updates)
  }

  const launchChildren = useMemo(() => {
    switch (formStore.currentEmbedConfig.openTrigger) {
      case 'delay':
        return (
          <Input
            className="mt-2"
            trailing="seconds delay"
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
            trailing="% of page scrolled"
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
          <div className="mb-1 text-sm font-medium text-slate-700">Modal size</div>
          <Select
            options={SIZE_OPTIONS}
            value={formStore.currentEmbedConfig.size}
            onChange={size => handleChange({ size })}
          />
        </div>
      )}

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">Launch</div>
        <Select
          options={LAUNCH_OPTIONS}
          value={formStore.currentEmbedConfig.openTrigger}
          onChange={openTrigger => handleChange({ openTrigger })}
        />
        {launchChildren}
      </div>

      {children}

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">Trigger background</div>
        <ColorPickerDropdown
          value={formStore.currentEmbedConfig.triggerBackground}
          onChange={triggerBackground => handleChange({ triggerBackground })}
        />
      </div>

      {formStore.embedType === 'modal' && (
        <div>
          <div className="mb-1 text-sm font-medium text-slate-700">Trigger text</div>
          <Input
            value={formStore.currentEmbedConfig.triggerText}
            maxLength={20}
            onChange={triggerText => handleChange({ triggerText })}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">Close on submit</div>
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
            trailing="seconds delay"
            value={formStore.currentEmbedConfig.autoClose}
            onChange={autoClose => handleChange({ autoClose })}
          />
        )}
      </div>
    </FullpageSettings>
  )
})
