import { IconCheck } from '@tabler/icons-react'
import { FC, MouseEvent, useCallback } from 'react'

interface CheckboxProps extends Omit<ComponentProps, 'onChange'> {
  value?: boolean
  disabled?: boolean
  onChange?: (value: boolean, event: MouseEvent<HTMLButtonElement>) => void
}

export const Checkbox: FC<CheckboxProps> = ({ value, disabled, onChange }) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onChange?.(!value, event)
    },
    [onChange, value]
  )

  return (
    <button
      type="button"
      role="checkbox"
      className="focus-visible:ring-ring peer h-4 w-4 rounded border border-primary focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary"
      value="on"
      data-state={value ? 'checked' : 'unchecked'}
      aria-checked={value}
      disabled={disabled}
      onClick={handleClick}
    >
      {value && (
        <span
          data-state="checked"
          className="pointer-events-none flex items-center justify-center text-foreground"
        >
          <IconCheck className="h-4 w-4" data-slot="icon" />
        </span>
      )}
    </button>
  )
}
