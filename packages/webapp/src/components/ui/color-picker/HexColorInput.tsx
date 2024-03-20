import { ChangeEvent, FC, useEffect, useRef, useState } from 'react'

export interface HexColorInputProps {
  value?: string
  onChange?: (value?: string) => void
}

const validHex = (hex: string): boolean => /^#?([A-Fa-f0-9]{3,4}){1,2}$/.test(hex)

export const HexColorInput: FC<HexColorInputProps> = ({ value: rawValue, onChange }) => {
  const [value, setValue] = useState(rawValue)
  const isFocus = useRef(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value.trim()

    if (validHex(newValue)) {
      onChange?.(newValue)
    }

    setValue(newValue)
  }

  function handleFocus() {
    isFocus.current = true
  }

  function handleBlur() {
    isFocus.current = false
    onChange?.(rawValue)
  }

  useEffect(() => {
    if (rawValue !== value && !isFocus.current) {
      setValue(rawValue)
    }
  }, [rawValue])

  return (
    <input
      value={value}
      spellCheck="false"
      autoComplete="off"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  )
}
