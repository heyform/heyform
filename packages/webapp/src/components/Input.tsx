import { helper } from '@heyform-inc/utils'
import { IconEye, IconEyeClosed } from '@tabler/icons-react'
import {
  ChangeEvent,
  CompositionEvent,
  FC,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'

import { cn } from '@/utils'

import { Select } from './Select'

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  autoFocus?: boolean
  hasError?: boolean
  maxLength?: number
  onChange?: (value: any) => void
  onEnter?: (value: any) => void
  onFocus?: () => void
  onBlur?: () => void
}

export interface InputRef {
  clear: () => void
  submit: () => void
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  ref?: Ref<InputRef>
  autoFocus?: boolean
  hasError?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  maxLength?: number
  onChange?: (value: any) => void
  onEnter?: (value: any) => void
  onFocus?: () => void
  onBlur?: () => void
}

interface TypeNumberOption {
  value: string
  label: string
  step?: number
  min?: number
  max?: number
}

export interface TypeNumberValue {
  value: number
  type: string
}

interface TypeNumberProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: TypeNumberValue
  options: TypeNumberOption[]
  onChange?: (value: TypeNumberValue) => void
}

const InputComponent: FC<InputProps> = ({
  ref,
  className,
  type = 'text',
  min,
  max,
  autoFocus,
  hasError,
  disabled,
  leading,
  trailing,
  maxLength,
  value: rawValue = '',
  onChange,
  onEnter,
  ...restProps
}) => {
  const lock = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isCountingEnabled = maxLength && maxLength > 0

  const [value, setValue] = useState<Any>(rawValue as Any)
  const [length, setLength] = useState(String(rawValue).length)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    let newValue = getValue(event)

    if (isCountingEnabled) {
      let newLength = helper.isNil(newValue) ? 0 : String(newValue).length

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
    if (!lock.current && event.key === 'Enter') {
      onEnter?.(getValue(event as Any))
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
          newValue = rawValue as Any
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
    onChange?.(getValue(event as Any))
  }

  function handleMouseUp() {
    inputRef.current?.focus()
  }

  useImperativeHandle<InputRef, InputRef>(
    ref,
    () => ({
      clear() {
        setValue('')
      },
      submit() {
        onEnter?.(inputRef.current?.value)
      }
    }),
    []
  )

  useEffect(() => {
    if (rawValue !== value) {
      lock.current = false

      setValue(rawValue as Any)
      setLength((rawValue as Any)?.length || 0)
    }
  }, [rawValue])

  useEffect(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus()
    }
  }, [inputRef])

  return (
    <div
      className={cn('relative', className)}
      data-slot={(restProps as AnyMap)['data-slot']}
      onMouseUp={handleMouseUp}
    >
      {leading && (
        <div
          className="absolute bottom-0 left-3.5 top-0 flex items-center gap-x-2 sm:left-3"
          data-slot="leading"
        >
          {leading}
        </div>
      )}

      <input
        ref={inputRef}
        className={cn(
          'block w-full appearance-none rounded-lg border bg-transparent px-3.5 py-2.5 text-base/[1.4rem] ring-0 placeholder:text-secondary focus:border-input focus:shadow-none focus:outline-none focus:ring-0 data-[type=number]:pr-0.5 sm:px-3 sm:py-2 sm:text-sm/[1.4rem] data-[type=number]:sm:pr-0.5',
          hasError ? 'border-error focus:border-error' : 'border-input focus:border-input'
        )}
        type={type}
        value={value}
        disabled={disabled}
        {...restProps}
        data-slot="input"
        data-type={type}
        onInput={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />

      {(isCountingEnabled || trailing) && (
        <div
          className="absolute bottom-0 right-0 top-0 flex items-center gap-x-2 px-3.5 text-sm text-secondary sm:px-3"
          data-slot="trailing"
        >
          {isCountingEnabled && (
            <div data-slot="counting">
              {length}/{maxLength}
            </div>
          )}

          {trailing}
        </div>
      )}
    </div>
  )
}

const PasswordComponent: FC<Omit<InputProps, 'type'>> = ({ trailing, ...restProps }) => {
  const [type, setType] = useState('password')

  function handleToggle() {
    setType(v => (v === 'password' ? 'text' : 'password'))
  }

  const Toggle = useMemo(() => {
    return (
      <>
        {trailing}

        <button
          className="text-secondary hover:text-primary"
          type="button"
          data-slot="toggle-button"
          onClick={handleToggle}
        >
          {type === 'password' ? (
            <IconEyeClosed className="h-5 w-5" data-slot="toggle-icon" />
          ) : (
            <IconEye className="h-5 w-5" data-slot="toggle-icon" />
          )}
        </button>
      </>
    )
  }, [trailing, type])

  return (
    <InputComponent
      className="[&_[data-slot=input]]:pr-11 sm:[&_[data-slot=input]]:pr-10"
      type={type}
      trailing={Toggle}
      {...restProps}
    />
  )
}

const TypeNumber: FC<TypeNumberProps> = ({ className, value, options, onChange }) => {
  const option = useMemo(
    () => options.find(row => row.value === value?.type) || options[0],
    [options, value?.type]
  )

  const handleValueChange = useCallback(
    (newValue: number) => {
      onChange?.({
        value: newValue,
        type: option.value
      })
    },
    [onChange, option.value]
  )

  const handleOptionChange = useCallback(
    (newType: any) => {
      const newOption = options.find(row => row.value === newType) as TypeNumberOption
      let newValue = value?.value

      if (newOption.min && (!newValue || newValue < newOption.min)) {
        newValue = newOption.min
      } else if (newOption.max && (!newValue || newValue > newOption.max)) {
        newValue = newOption.max
      }

      onChange?.({
        value: newValue as number,
        type: newType
      })
    },
    [onChange, options, value?.value]
  )

  useEffect(() => {
    if (helper.isEmpty(value)) {
      onChange?.({
        value: options[0].min || 1,
        type: options[0].value
      })
    }
  }, [])

  return (
    <div className={cn('inline-flex w-full items-center sm:w-auto', className)}>
      <Input
        className="flex-1 [&_[data-slot=input]]:rounded-r-none [&_[data-slot=input]]:py-2"
        data-slot="number"
        value={value?.value}
        type="number"
        min={option.min}
        max={option.max}
        onChange={handleValueChange}
      />
      <Select
        className="min-w-[6.25rem] gap-x-1 rounded-l-none border-l-0 sm:py-2 [&_[data-slot=value]]:pl-0"
        data-slot="select"
        value={option.value}
        options={options}
        onChange={handleOptionChange}
      />
    </div>
  )
}

const TextArea: FC<TextAreaProps> = ({
  className,
  autoFocus,
  hasError,
  disabled,
  maxLength,
  value: rawValue = '',
  onChange,
  onEnter,
  ...restProps
}) => {
  const lock = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isCountingEnabled = maxLength && maxLength > 0

  const [value, setValue] = useState<Any>(rawValue as Any)
  const [length, setLength] = useState(String(rawValue).length)

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!lock.current && event.key === 'Enter') {
      onEnter?.(getValue(event as Any))
    }
  }

  function getValue(event: ChangeEvent<HTMLTextAreaElement>) {
    return event.target.value
  }

  function handleCompositionStart() {
    lock.current = true
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
    lock.current = false
    onChange?.(getValue(event as Any))
  }

  function handleMouseUp() {
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (rawValue !== value) {
      lock.current = false

      setValue(rawValue as Any)
      setLength((rawValue as Any)?.length || 0)
    }
  }, [rawValue])

  useEffect(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus()
    }
  }, [inputRef])

  return (
    <div className={cn('relative', className)} onMouseUp={handleMouseUp}>
      <textarea
        ref={inputRef}
        className={cn(
          'scrollbar block w-full appearance-none rounded-lg border bg-transparent px-3.5 py-2.5 text-base/[1.4rem] ring-0 placeholder:text-secondary focus:border-input focus:shadow-none focus:outline-none focus:ring-0 sm:px-3 sm:py-2 sm:text-sm/[1.4rem]',
          hasError ? 'border-error focus:border-error' : 'border-input focus:border-input'
        )}
        data-slot="textarea"
        value={value}
        disabled={disabled}
        onInput={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        {...restProps}
      />

      {isCountingEnabled && (
        <div
          className="pointer-events-none absolute bottom-2 right-0 flex items-center gap-x-2 px-3.5 sm:px-3"
          data-slot="trailing"
        >
          <div className="text-sm text-secondary" data-slot="counting">
            {length}/{maxLength}
          </div>
        </div>
      )}
    </div>
  )
}

export const Input = Object.assign(InputComponent, {
  Password: PasswordComponent,
  TypeNumber,
  TextArea
})
