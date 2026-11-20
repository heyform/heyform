import { IconCheck } from '@tabler/icons-react'
import { FC, MouseEvent, useCallback } from 'react'

import { cn } from '@/utils'

interface CheckboxProps extends Omit<ComponentProps, 'onChange'> {
  'aria-label'?: string
  value?: boolean
  disabled?: boolean
  onChange?: (value: boolean, event: MouseEvent<HTMLButtonElement>) => void
}

export const Checkbox: FC<CheckboxProps> = ({
  className,
  'aria-label': label,
  value,
  disabled,
  onChange
}) => {
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
      className={cn(
        'focus-visible:ring-ring border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary peer h-4 w-4 rounded border focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      value="on"
      data-state={value ? 'checked' : 'unchecked'}
      aria-label={label}
      aria-checked={value}
      disabled={disabled}
      onClick={handleClick}
    >
      {value && (
        <span
          data-state="checked"
          className="text-foreground pointer-events-none flex items-center justify-center"
        >
          <IconCheck className="h-4 w-4" data-slot="icon" />
        </span>
      )}
    </button>
  )
}
