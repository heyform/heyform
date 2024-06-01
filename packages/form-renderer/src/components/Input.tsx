import { helper } from '@heyform-inc/utils'
import type { ChangeEvent, FC } from 'react'
import { useEffect, useRef, useState } from 'react'

import { IComponentProps } from '../typings'

interface InputProps extends IComponentProps {
  type?: 'text' | 'email' | 'number' | 'tel'
  disabled?: boolean
  autoFocus?: boolean
  min?: number
  max?: number
  value?: any
  placeholder?: string
  onChange?: (value?: any) => void
}

export const Input: FC<InputProps> = ({
  type,
  value: rawValue = '',
  disabled,
  autoFocus,
  onChange,
  ...restProps
}) => {
  const ref = useRef<HTMLInputElement>(null)
  const lockRef = useRef(false)

  const [value, setValue] = useState(rawValue)

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

  useEffect(() => {
    if (ref.current && autoFocus) {
      ref.current.focus()
    }
  }, [ref])

  return (
    <input
      ref={ref}
      className="input heyform-input"
      type={type}
      value={value as string}
      disabled={disabled}
      onChange={handleChange}
      {...restProps}
    />
  )
}
