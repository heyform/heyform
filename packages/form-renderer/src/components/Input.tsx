import { helper } from '@heyform-inc/utils'
import type { ChangeEvent, FC, KeyboardEvent, CompositionEvent, Ref } from 'react'
import { useEffect, useRef, useState, useImperativeHandle } from 'react'

import { IComponentProps } from '../typings'

interface InputProps extends Omit<IComponentProps, 'onKeyDown'> {
  ref?: Ref<InputRef>
  type?: 'text' | 'email' | 'number' | 'tel'
  disabled?: boolean
  autoFocus?: boolean
  min?: number
  max?: number
  value?: any
  placeholder?: string
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>, isCompositionStart: boolean) => void
  onChange?: (value?: any) => void
}

export interface InputRef {
  focus: () => void
  blur: () => void
}

export const Input: FC<InputProps> = ({
  ref,
  type,
  value: rawValue = '',
  disabled,
  autoFocus,
  onKeyDown,
  onChange,
  ...restProps
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const lockRef = useRef(false)

  const [value, setValue] = useState(rawValue)

  function getValue(event: any) {
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

    return newValue
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = getValue(event)

    setValue(newValue)

    if (!lockRef.current) {
      onChange?.(newValue)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event, lockRef.current)
  }

  function handleCompositionStart() {
    lockRef.current = true
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLInputElement>) {
    lockRef.current = false
    onChange?.(getValue(event))
  }

  useImperativeHandle<InputRef, InputRef>(
    ref,
    () => ({
      focus() {
        inputRef.current?.focus()
      },
      blur() {
        inputRef.current?.blur()
      }
    }),
    []
  )

  useEffect(() => {
    if (rawValue !== value) {
      lockRef.current = false
      setValue(rawValue)
    }
  }, [rawValue])

  useEffect(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus()
    }
  }, [inputRef])

  return (
    <input
      ref={inputRef}
      className="input heyform-input"
      type={type}
      value={value as string}
      disabled={disabled}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      {...restProps}
    />
  )
}
