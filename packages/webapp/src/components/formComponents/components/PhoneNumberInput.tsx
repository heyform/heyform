import { helper } from '@heyform-inc/utils'
import type { PhoneNumber } from 'libphonenumber-js'
import {
  formatIncompletePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumber
} from 'libphonenumber-js'
import type { FC } from 'react'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'

import { COUNTRIES } from '../consts'
import { CountrySelect } from './CountrySelect'
import { Input } from './Input'

interface PhoneNumberInputProps {
  value?: string
  defaultCountryCode?: string
  onDropdownVisibleChange?: (visible: boolean) => void
  onChange?: (value: string) => void
}

function format(input: string, countryCode: string) {
  return formatIncompletePhoneNumber(input, countryCode as any)
}

function parse(input: string, countryCode: string): PhoneNumber | undefined {
  try {
    return parsePhoneNumber(input, countryCode as any)
  } catch (_) {}
}

export const PhoneNumberInput: FC<PhoneNumberInputProps> = ({
  defaultCountryCode = 'US',
  value: rawValue = '',
  onDropdownVisibleChange,
  onChange
}) => {
  const [value, setValue] = useState<string>()
  const [countryCode, setCountryCode] = useState(defaultCountryCode)

  const placeholder = useMemo(
    () => COUNTRIES.find(c => c.value === countryCode)?.example,
    [countryCode]
  )

  function handleCodeChange(newCountryCode: any) {
    setCountryCode(newCountryCode)

    if (helper.isValid(value) && isValidPhoneNumber(value!, newCountryCode)) {
      const newValue = format(value!, newCountryCode)
      setValue(newValue)

      const parsed = parse(newValue, newCountryCode)
      onChange?.(parsed?.number || '')
    }
  }

  function handleInputChange(inputValue: string) {
    let newCountryCode = countryCode
    const parsed = parse(inputValue, countryCode)

    if (helper.isValid(parsed?.country) && parsed!.country! !== countryCode) {
      newCountryCode = parsed!.country!
      setCountryCode(newCountryCode)
    }

    let newValue = format(inputValue, newCountryCode)

    // Fork from https://github.com/catamphetamine/react-phone-number-input/blob/master/source/InputBasic.js#L27
    // By default, if a value is something like `"(123)"`
    // then Backspace would only erase the rightmost brace
    // becoming something like `"(123"`
    // which would give the same `"123"` value
    // which would then be formatted back to `"(123)"`
    // and so a user wouldn't be able to erase the phone number.
    // Working around this issue with this simple hack.
    if (newValue === value) {
      const formatted = format(newValue, newCountryCode)

      if (formatted.indexOf(inputValue) === 0) {
        // Trim the last digit (or plus sign).
        newValue = newValue.slice(0, -1)
      }
    }

    setValue(newValue)

    startTransition(() => {
      onChange?.(parsed?.number || '')
    })
  }

  const handleCodeChangeCallback = useCallback(handleCodeChange, [value])
  const handleInputChangeCallback = useCallback(handleInputChange, [countryCode, value])

  useEffect(() => {
    if (isValidPhoneNumber(rawValue)) {
      const parsed = parsePhoneNumber(rawValue, countryCode as any)

      if (parsed) {
        const { country, nationalNumber } = parsed
        const newValue = format(nationalNumber! as string, country!)

        setValue(newValue)
        setCountryCode(country!)
      }
    }
  }, [])

  return (
    <div className="flex items-center">
      <CountrySelect
        popupClassName="heyform-phone-number-popup"
        enableLabel={false}
        enableCallingCode={true}
        value={countryCode}
        onDropdownVisibleChange={onDropdownVisibleChange}
        onChange={handleCodeChangeCallback}
      />
      <Input
        type="tel"
        value={value}
        placeholder={placeholder}
        onChange={handleInputChangeCallback}
      />
    </div>
  )
}
