import { IconChevronDown } from '@tabler/icons-react'
import type { FC } from 'react'

import { Button, ColorPicker as CP, Dropdown, Menus, stopPropagation } from '@/components/ui'
import { COLOR_PICKER_PRESET_COLORS } from '@/consts'

interface ColorPickerFieldProps {
  label: string
  value?: string
  onChange?: (value: string) => void
}

export const ColorPickerDropdown: FC<Omit<ColorPickerFieldProps, 'label'>> = ({
  value,
  onChange
}) => {
  function handleChange(newValue: string) {
    onChange?.(newValue)
  }

  const Overlay = (
    <Menus className="!w-[280px] !p-4">
      <CP value={value} presets={COLOR_PICKER_PRESET_COLORS} onChange={handleChange} />
    </Menus>
  )

  return (
    <Dropdown placement="right" offset={[0, 12]} overlay={Overlay} dismissOnClickInside={false}>
      <div
        className="relative h-5 w-5 cursor-pointer rounded after:absolute after:inset-0 after:rounded after:border after:border-black/10"
        role="button"
        style={{ background: value }}
      />
    </Dropdown>
  )
}

export const ColorPickerField: FC<ColorPickerFieldProps> = ({ label, value, onChange }) => {
  const Overlay = (
    <Menus>
      <div className="color-picker-popup" onClick={stopPropagation}>
        <CP color={value} presets={COLOR_PICKER_PRESET_COLORS} onChange={onChange} />
      </div>
    </Menus>
  )

  return (
    <div className="right-sidebar-settings-item">
      <div className="flex items-center justify-between">
        <label className="form-item-label">{label}</label>
        <Dropdown overlay={Overlay}>
          <Button className="color-picker-button" trailing={<IconChevronDown />}>
            <div className="color-picker-value" style={{ backgroundColor: value }}></div>
          </Button>
        </Dropdown>
      </div>
    </div>
  )
}
