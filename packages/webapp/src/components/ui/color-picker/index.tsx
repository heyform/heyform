import { helper } from '@heyform-inc/utils'
import colorToRgba from 'color-rgba'
import { FC, startTransition, useCallback, useEffect, useState } from 'react'
import { HexAlphaColorPicker } from 'react-colorful'

import { IComponentProps } from '../typing'
import { AlphaInput } from './AlphaInput'
import { HexColorInput } from './HexColorInput'
import { rgbaToString } from './helper'

export interface ColorPickerProps extends Omit<IComponentProps, 'onChange'> {
  value?: string
  presets?: string[]
  onChange?: (value: string) => void
}

interface PresetProps {
  color: string
  onClick: (color: string) => void
}

const Preset: FC<PresetProps> = ({ color, onClick }) => {
  function handleClick() {
    onClick(color)
  }

  return (
    <div
      className="color-picker-preset"
      style={{
        backgroundColor: color
      }}
      onClick={handleClick}
    />
  )
}

const toHex = (value: string) => rgbaToString('hex', colorToRgba(value) || [])
const toAlphaHex = (value: string, alpha: number) =>
  rgbaToString('hex', [...(colorToRgba(value) || []).slice(0, 3), alpha])

const ColorPicker: FC<ColorPickerProps> = ({
  value: rawValue = '#ffffff',
  presets = [],
  onChange,
  ...restProps
}) => {
  const [value, setValue] = useState(toHex(rawValue))

  function handleChange(newValue: any) {
    startTransition(() => {
      onChange?.(newValue)
    })
  }

  const handleAlphaChange = useCallback(
    (alpha: number) => {
      handleChange(toAlphaHex(value!, alpha))
    },
    [value]
  )

  useEffect(() => {
    if (rawValue !== value) {
      startTransition(() => {
        setValue(toHex(rawValue))
      })
    }
  }, [rawValue])

  return (
    <div className="color-picker" {...restProps}>
      <HexAlphaColorPicker color={value} onChange={handleChange} />

      <div className="color-picker-input">
        <div className="color-picker-value">
          <HexColorInput value={value} onChange={handleChange} />
        </div>
        <AlphaInput color={value} onChange={handleAlphaChange} />
      </div>

      {helper.isValidArray(presets) && (
        <div className="color-picker-presets">
          {presets.map(color => (
            <Preset key={color} color={color} onClick={handleChange} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ColorPicker
