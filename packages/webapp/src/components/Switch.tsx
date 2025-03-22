import { FC, MouseEvent, useCallback } from 'react'

import { cn } from '@/utils'

import { Loader } from './Loader'

interface SwitchProps extends Omit<ComponentProps, 'onChange'> {
  disabled?: boolean
  loading?: boolean
  value?: boolean
  onChange?: (value: boolean, event: MouseEvent) => void
}

export const Switch: FC<SwitchProps> = ({ className, disabled, loading, value, onChange }) => {
  const handleChange = useCallback(
    (event: MouseEvent) => {
      onChange?.(!value, event)
    },
    [onChange, value]
  )

  return (
    <div className={cn('relative flex items-center', className)}>
      <button
        className={cn(
          'group isolate inline-flex h-6 w-10 cursor-pointer rounded-full bg-primary/20 p-[3px] ring-1 ring-inset ring-black/5 focus:outline-none disabled:pointer-events-none disabled:cursor-default data-[checked=true]:bg-primary sm:h-5 sm:w-8',
          {
            'opacity-0': loading
          }
        )}
        type="button"
        role="switch"
        disabled={loading || disabled}
        aria-checked={value}
        data-checked={value}
        onClick={handleChange}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none relative inline-block size-[1.125rem] translate-x-0 rounded-full border border-transparent bg-foreground shadow ring-1 ring-black/5 transition duration-200 ease-in-out group-disabled:opacity-50 group-data-[checked=true]:translate-x-4 sm:size-3.5 group-data-[checked=true]:sm:translate-x-3"
        />
      </button>
      {loading && <Loader className="absolute left-2.5 top-0 h-5 w-5 sm:left-1.5" />}
    </div>
  )
}
