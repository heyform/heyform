import { helper } from '@heyform-inc/utils'
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

export interface AlphaInputProps {
  color?: string
  onChange?: (alpha: number) => void
}

function range(alpha: number) {
  return Math.max(0, Math.min(alpha, 100))
}

function getColorAlpha(color?: string) {
  if (color) {
    const rgba = colorToRgba(color)

    if (rgba) {
      return Math.round(rgba[3] * 100)
    }
  }

  return 100
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
    /**
     * see https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event
     */
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
    <div className="color-picker-alpha">
      <input
        ref={ref}
        spellCheck="false"
        value={value}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
      />
      <div className="color-picker-alpha-ticker">
        <button className="color-picker-alpha-ticker-button" onClick={handleIncrease}>
          <IconChevronUp />
        </button>
        <button className="color-picker-alpha-ticker-button" onClick={handleDecrease}>
          <IconChevronDown />
        </button>
      </div>
    </div>
  )
}
