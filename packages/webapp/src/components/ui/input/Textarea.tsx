import clsx from 'clsx'
import type { ChangeEvent, CompositionEvent, FC, LegacyRef, TextareaHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  isHasError?: boolean
  onChange?: (value: string | number | undefined) => void
  onFocus?: () => void
  onBlur?: () => void
}

const Textarea: FC<TextareaProps> = ({
  className,
  autoFocus,
  isHasError,
  disabled,
  value: rawValue = '',
  onChange,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const lock = useRef(false)
  const ref = useRef<HTMLAreaElement>(null)
  const [value, setValue] = useState<string | number>(rawValue as any)
  const [isFocused, setIsFocused] = useState(false)

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const newValue = event.currentTarget.value

    setValue(newValue)

    if (!lock.current) {
      onChange?.(newValue)
    }
  }

  function handleMouseUp() {
    ref.current?.focus()
  }

  function handleCompositionStart() {
    lock.current = true
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
    lock.current = false
    onChange?.(event.currentTarget.value)
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
        'textarea',
        {
          'input-focused': isFocused,
          'textarea-disabled': disabled,
          'input-has-error': isHasError
        },
        className
      )}
      onMouseUp={handleMouseUp}
    >
      <textarea
        ref={ref as unknown as LegacyRef<HTMLTextAreaElement>}
        value={value}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        {...restProps}
      />
    </div>
  )
}

export default Textarea
