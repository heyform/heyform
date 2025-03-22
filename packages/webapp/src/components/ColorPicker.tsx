import { helper } from '@heyform-inc/utils'
import { Content, PopoverContentProps, Portal, Root, Trigger } from '@radix-ui/react-popover'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import colorToRgba from 'color-rgba'
import {
  ChangeEvent,
  FC,
  KeyboardEvent,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { HexAlphaColorPicker } from 'react-colorful'

import { cn } from '@/utils'

interface HexColorInputProps {
  value?: string
  onChange?: (value?: string) => void
}

interface AlphaInputProps {
  color?: string
  onChange?: (alpha: number) => void
}

interface ColorPickerProps extends Omit<ComponentProps, 'onChange'> {
  value?: string
  presets?: string[]
  contentProps?: PopoverContentProps
  onChange?: (value: string) => void
}

const PRESET_COLORS = [
  '#ffffff',
  '#fef2f2',
  '#fff7ed',
  '#fefce8',
  '#f0fdf4',
  '#ecfeff',
  '#eff6ff',
  '#faf5ff',

  '#e4e4e7',
  '#fecaca',
  '#fed7aa',
  '#fef08a',
  '#bbf7d0',
  '#a5f3fc',
  '#bfdbfe',
  '#e9d5ff',

  '#a1a1aa',
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#22d3ee',
  '#60a5fa',
  '#c084fc',

  '#71717a',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',

  '#52525b',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#9333ea'
]

function rgbaToString(rgba: number[]) {
  if (helper.isValidArray(rgba)) {
    const [r, g, b, alpha] = rgba!

    let value = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')

    if (alpha < 1) {
      value += Math.round(alpha * 0xff)
        .toString(16)
        .padStart(2, '0')
    }

    return value
  }
}

const toHex = (value: string) => rgbaToString(colorToRgba(value) || [])
const toAlphaHex = (value: string, alpha: number) =>
  rgbaToString([...(colorToRgba(value) || []).slice(0, 3), alpha])
const validateHex = (hex: string): boolean => /^#?([A-Fa-f0-9]{3,4}){1,2}$/.test(hex)

function range(alpha: number) {
  return Math.max(0, Math.min(alpha, 100))
}

function getColorAlpha(color?: string) {
  if (color) {
    const rgba = colorToRgba(color)

    if (helper.isValidArray(rgba)) {
      return Math.round((rgba as number[])[3] * 100)
    }
  }

  return 100
}

const HexColorInput: FC<HexColorInputProps> = ({ value: rawValue, onChange }) => {
  const [value, setValue] = useState(rawValue)
  const isFocus = useRef(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value.trim()

    if (validateHex(newValue)) {
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
  }, [rawValue, value])

  return (
    <input
      className="w-full flex-1 appearance-none rounded-lg border border-input bg-transparent px-3.5 py-1 text-base/[1.4rem] placeholder:text-secondary focus:outline-none sm:px-3 sm:text-sm/[1.4rem]"
      value={value}
      spellCheck="false"
      autoComplete="off"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  )
}

export const AlphaInput: FC<AlphaInputProps> = ({ color, onChange }) => {
  const lock = useRef(false)
  const ref = useRef<HTMLInputElement>(null)

  const alpha = useMemo(() => getColorAlpha(color), [color])
  const [value, setValue] = useState(`${alpha}%`)

  function transitionUpdate(newValue: number) {
    startTransition(() => {
      onChange?.(newValue / 100)
    })
  }

  function handleUpdate(newValue: string) {
    newValue = newValue.replace(/[^0-9.]/g, '')
    let newAlpha = alpha

    if (helper.isValid(newValue)) {
      const num = parseFloat(newValue)

      if (!isNaN(num)) {
        if (num < 1) {
          newAlpha = range(Math.floor(num * 100))
        } else {
          newAlpha = range(num)
        }
      }
    }

    transitionUpdate(newAlpha)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.type === 'compositionstart') {
      lock.current = true
      return
    }

    if (event.type === 'compositionend') {
      lock.current = false
    }

    setValue(event.target.value)
  }

  function handleBlur() {
    handleUpdate(value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!lock.current && event.code === 'Enter') {
      handleUpdate(value)
    }
  }

  const handleIncrease = useCallback(() => {
    transitionUpdate(range(alpha + 1))
  }, [color, alpha])

  const handleDecrease = useCallback(() => {
    transitionUpdate(range(alpha - 1))
  }, [color, alpha])

  useEffect(() => {
    const newAlpha = range(alpha)
    setValue(`${newAlpha}%`)
  }, [alpha])

  return (
    <div className="relative">
      <input
        className="max-w-20 appearance-none rounded-lg border border-input bg-transparent py-1 pl-3.5 pr-6 text-base/[1.4rem] placeholder:text-secondary focus:outline-none sm:pl-3 sm:text-sm/[1.4rem]"
        ref={ref}
        spellCheck="false"
        value={value}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
      />
      <div className="absolute bottom-0 right-2 top-0 flex flex-col justify-center">
        <button
          className="flex h-3 w-4 items-center justify-center rounded-sm text-secondary hover:bg-accent-light focus:text-primary"
          onClick={handleIncrease}
        >
          <IconChevronUp className="h-4 w-4" />
        </button>
        <button
          className="flex h-3 w-4 items-center justify-center rounded-sm text-secondary hover:bg-accent-light focus:text-primary"
          onClick={handleDecrease}
        >
          <IconChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const ColorPickerComponent: FC<ColorPickerProps> = ({
  value: rawValue = '#ffffff',
  presets = PRESET_COLORS,
  onChange,
  ...restProps
}) => {
  const [value, setValue] = useState(toHex(rawValue))

  const handleChange = useCallback(
    (newValue: any) => {
      startTransition(() => {
        onChange?.(newValue)
      })
    },
    [onChange]
  )

  const handleAlphaChange = useCallback(
    (alpha: number) => {
      handleChange(toAlphaHex(value!, alpha))
    },
    [handleChange, value]
  )

  useEffect(() => {
    if (rawValue !== value) {
      startTransition(() => {
        setValue(toHex(rawValue))
      })
    }
  }, [rawValue, value])

  return (
    <div className="color-picker" {...restProps}>
      <HexAlphaColorPicker color={value} onChange={handleChange} />

      <div className="flex items-center gap-2">
        <HexColorInput value={value} onChange={handleChange} />
        <AlphaInput color={value} onChange={handleAlphaChange} />
      </div>

      {helper.isValidArray(presets) && (
        <ul className="grid grid-cols-8 gap-2 pt-2">
          {presets.map(row => (
            <li key={row} className="h-5 w-5">
              <button
                type="button"
                className="h-full w-full rounded-md border border-input"
                style={{
                  backgroundColor: row
                }}
                onClick={() => handleChange(row)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const ColorPicker: FC<ColorPickerProps> = ({ contentProps, ...restProps }) => {
  const [isOpen, setOpen] = useState(false)

  return (
    <Root open={isOpen} onOpenChange={setOpen}>
      <Trigger asChild>
        <button
          type="button"
          className="h-5 w-5 rounded-md border border-input"
          style={{
            backgroundColor: restProps.value
          }}
        />
      </Trigger>

      <Portal>
        <Content
          sideOffset={8}
          {...contentProps}
          className={cn(
            'z-10 w-[16.5rem] origin-top-left rounded-lg bg-foreground p-4 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[align=end]:origin-top-right data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90',
            contentProps?.className
          )}
        >
          <ColorPickerComponent {...restProps} />
        </Content>
      </Portal>
    </Root>
  )
}
