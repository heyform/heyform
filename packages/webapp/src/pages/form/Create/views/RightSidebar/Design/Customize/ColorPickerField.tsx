import { IconChevronDown } from '@tabler/icons-react'
import type { FC } from 'react'

import { Button, ColorPicker, Dropdown, Menus, stopPropagation } from '@/components/ui'
import { COLOR_PICKER_PRESET_COLORS } from '@/consts'

interface ColorPickerFieldProps {
  label: string
  value?: string
  onChange?: (value: string) => void
}

export const ColorPickerField: FC<ColorPickerFieldProps> = ({ label, value, onChange }) => {
  const Overlay = (
    <Menus>
      <div className="color-picker-popup" onClick={stopPropagation}>
        <ColorPicker color={value} presets={COLOR_PICKER_PRESET_COLORS} onChange={onChange} />
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
