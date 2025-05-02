import { helper } from '@heyform-inc/utils'
import type { ChangeEvent, FC } from 'react'
import { useEffect, useRef, useState } from 'react'

interface InputProps extends IComponentProps {
  type?: 'text' | 'email' | 'number' | 'tel'
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  value?: any
  onChange?: (value?: any) => void
}

export const Input: FC<InputProps> = ({
  type,
  value: rawValue = '',
  disabled,
  onChange,
  ...restProps
}) => {
  const [value, setValue] = useState(rawValue)
  const lockRef = useRef(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    let newValue: any = event.target.value

    /**
     * If type is number, convert value to number
     * If min or max is not empty, limit the input range
     */
    if (type === 'number') {
      newValue = Number(newValue)

      if (helper.isNan(value)) {
        newValue = rawValue
      } else if (restProps.max && newValue > restProps.max) {
        newValue = restProps.max
      } else if (!helper.isNil(restProps.min) && newValue < restProps.min!) {
        newValue = restProps.min!
      }
    }

    setValue(newValue)

    /**
     * see https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event
     */
    if (event.type === 'compositionstart') {
      lockRef.current = true
      return
    }

    if (event.type === 'compositionend') {
      lockRef.current = false
    }

    if (!lockRef.current) {
      onChange?.(newValue)
    }
  }

  useEffect(() => {
    if (rawValue !== value) {
      lockRef.current = false
      setValue(rawValue)
    }
  }, [rawValue])

  return (
    <input
      className="heyform-input"
      type={type}
      value={value as string}
      disabled={disabled}
      onChange={handleChange}
      {...restProps}
    />
  )
}
