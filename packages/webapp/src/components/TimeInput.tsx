import { helper } from '@heyform-inc/utils'
import { FC, useEffect, useState } from 'react'

import { Input, Select } from '@/components/ui'
import { SecondUtils } from '@/utils'

interface TimeInputProps {
  options: IOptionType[]
  value?: number
  onChange?: (value: number) => void
}

export const TimeInput: FC<TimeInputProps> = ({ value, options, onChange }) => {
  const [numValue, setNumValue] = useState<number>()
  const [unitValue, setUnitValue] = useState<string>(options[0]?.value as string)

  function handleInputChange(value: any) {
    setNumValue(Number(value))
    handleChange()
  }

  function handleUnitChange(unit: any) {
    setUnitValue(unit)
    handleChange()
  }

  function handleChange() {
    onChange?.(SecondUtils.parse(numValue ?? 0, unitValue))
  }

  useEffect(() => {
    if (helper.isValid(value)) {
      const [num, unit] = SecondUtils.stringify(value!)

      setNumValue(num)
      setUnitValue(unit)
    }
  }, [])

  return (
    <div className="time-input">
      <Input
        type="number"
        value={numValue}
        onChange={handleInputChange}
        trailing={
          <Select
            popupClassName="time-input-trailing"
            value={unitValue}
            options={options}
            onChange={handleUnitChange}
          />
        }
      />
    </div>
  )
}
