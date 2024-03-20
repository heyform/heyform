import clsx from 'clsx'
import type { ChangeEvent, FC } from 'react'
import { useState } from 'react'

import { IComponentProps } from '../typing'

interface SliderProps extends Omit<IComponentProps, 'value' | 'onChange'> {
  value?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onChange?: (value: number) => void
}

const Slider: FC<SliderProps> = ({
  className,
  value: rawValue = 0,
  min = 1,
  max = 10,
  step = 1,
  disabled,
  onChange,
  ...restProps
}) => {
  const [value, setValue] = useState(rawValue)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = Number(event.target.value)

    setValue(newValue)
    onChange?.(newValue)
  }

  return (
    <div className={clsx('slider', className)} {...restProps}>
      <div className="slider-progress">
        <div
          className="slider-progress-track"
          style={{
            width: `${(100 * (value - min)) / (max - min)}%`
          }}
        />
      </div>
      <input
        className="slider-input"
        type="range"
        role="slider"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

export default Slider
