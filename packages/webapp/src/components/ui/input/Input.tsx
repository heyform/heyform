import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import type {
  ChangeEvent,
  CompositionEvent,
  FC,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode
} from 'react'
import { useEffect, useRef, useState } from 'react'

import { KeyCode } from '../utils'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  autoFocus?: boolean
  isHasError?: boolean
  leadingClassName?: string
  trailingClassName?: string
  leading?: ReactNode
  trailing?: ReactNode
  maxLength?: number
  onChange?: (value: any) => void
  onEnter?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
}

const Input: FC<InputProps> = ({
  className,
  type = 'text',
  min,
  max,
  autoFocus,
  isHasError,
  disabled,
  leadingClassName,
  trailingClassName,
  leading,
  trailing,
  maxLength,
  value: rawValue = '',
  onChange,
  onFocus,
  onBlur,
  onEnter,
  ...restProps
}) => {
  const lock = useRef(false)
  const ref = useRef<HTMLInputElement>(null)
  const isCountingEnabled = maxLength && maxLength > 0

  const [value, setValue] = useState<any>(rawValue as any)
  const [isFocused, setIsFocused] = useState(false)
  const [length, setLength] = useState(String(rawValue).length)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    let newValue = getValue(event)

    if (isCountingEnabled) {
      let newLength = newValue.toString().length

      if (newLength > maxLength) {
        newLength = maxLength
        newValue = newValue.toString().slice(0, maxLength)
      }

      setLength(newLength)
    }

    setValue(newValue)

    if (!lock.current) {
      onChange?.(newValue)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!lock.current && event.keyCode === KeyCode.ENTER) {
      onEnter?.(getValue(event as any))
    }
  }

  function getValue(event: ChangeEvent<HTMLInputElement>) {
    let newValue: any = event.target.value

    if (type === 'file' && helper.isValid(event.target.files)) {
      newValue = event.target.files![0]
    }

    /**
     * If type is number, convert value to number
     * If min or max is not empty, limit the input range
     */
    if (type === 'number') {
      if (helper.isEmpty(newValue)) {
        newValue = ''
      } else {
        newValue = Number(newValue)

        if (helper.isNan(newValue)) {
          newValue = rawValue as any
        } else if (max && newValue > max) {
          newValue = max
        } else if (!helper.isNil(min) && newValue < min!) {
          newValue = min!
        }
      }
    }

    return newValue
  }

  function handleCompositionStart() {
    lock.current = true
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLInputElement>) {
    lock.current = false
    onChange?.(getValue(event as any))
  }

  function handleMouseUp() {
    ref.current?.focus()
  }

  function handleFocus() {
    setIsFocused(true)
    onFocus && onFocus()
  }

  function handleBlur() {
    setIsFocused(false)
    onBlur && onBlur()
  }

  useEffect(() => {
    if (rawValue !== value) {
      lock.current = false
      setValue(rawValue as any)
    }
  }, [rawValue])

  useEffect(() => {
    if (ref.current && autoFocus) {
      ref.current.focus()
    }
  }, [ref])

  return (
    <div
      className={clsx(
        'input',
        {
          'input-focused': isFocused,
          'input-disabled': disabled,
          'input-has-error': isHasError
        },
        className
      )}
      onMouseUp={handleMouseUp}
    >
      {leading && (
        <span
          className={clsx(
            'input-leading',
            {
              'pointer-events-none': helper.isString(leading)
            },
            leadingClassName
          )}
        >
          {leading}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        value={value as string}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        {...restProps}
      />
      {isCountingEnabled && (
        <span className="input-counting">
          {length}/{maxLength}
        </span>
      )}
      {trailing && (
        <span
          className={clsx(
            'input-trailing',
            {
              'pointer-events-none': helper.isString(leading)
            },
            trailingClassName
          )}
        >
          {trailing}
        </span>
      )}
    </div>
  )
}

export default Input
