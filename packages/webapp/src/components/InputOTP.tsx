'use client'

import { IconPointFilled } from '@tabler/icons-react'
import { OTPInput, OTPInputContext, OTPInputProps } from 'input-otp'
import { FC, useContext } from 'react'

import { cn } from '@/utils'

import { Loader } from './Loader'

type InputOTPProps = Omit<OTPInputProps, 'render'> & {
  loading?: boolean
}

const InputOTP: FC<InputOTPProps> = ({
  className,
  containerClassName,
  loading,
  disabled,
  children,
  ...restProps
}) => {
  return (
    <OTPInput
      containerClassName={cn(
        'relative flex items-center gap-2 justify-center has-[:disabled]:opacity-50',
        containerClassName
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      disabled={loading || disabled}
      {...restProps}
    >
      {children}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground">
          <Loader />
        </div>
      )}
    </OTPInput>
  )
}

const InputOTPGroup: FC<ComponentProps> = ({ className, ...restProps }) => {
  return <div className={cn('flex items-center', className)} {...restProps} />
}

const InputOTPSlot: FC<ComponentProps & { index: number }> = ({
  className,
  index,
  ...restProps
}) => {
  const inputOTPContext = useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      className={cn(
        'relative flex h-12 w-12 items-center justify-center border-y border-r border-input text-xl/6 font-medium transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        isActive && 'ring-ring z-10 ring-2',
        className
      )}
      {...restProps}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
}

const InputOTPSeparator: FC<ComponentProps> = ({ className, ...restProps }) => {
  return (
    <div role="separator" className={className} {...restProps}>
      <IconPointFilled className="h-3 w-3" />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
