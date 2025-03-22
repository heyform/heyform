import { preventDefault } from '@heyform-inc/form-renderer'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { ButtonHTMLAttributes, FC, ReactNode, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

import { Loader } from './Loader'
import { Tooltip } from './Tooltip'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
  loading?: boolean
}

interface CopyButtonProps extends Omit<ButtonProps, 'children'> {
  text: string
  icon?: ReactNode
  label?: string
  duration?: number
}

const ButtonComponent: FC<ButtonProps> = ({
  className,
  type = 'button',
  size = 'lg',
  iconOnly,
  loading,
  disabled,
  children,
  ...restProps
}) => {
  return (
    <button
      className={cn(
        'relative h-11 cursor-pointer rounded-lg border border-transparent bg-primary px-3.5 text-base/6 font-medium text-primary-light transition-colors duration-100 focus:outline-none focus-visible:outline-none focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[size=md]:h-9 data-[size=sm]:h-9 data-[size=lg]:hover:bg-opacity-80 data-[size=md]:hover:bg-opacity-80 sm:h-10 sm:px-3 sm:text-sm/6 data-[size=md]:sm:h-9 data-[size=sm]:sm:h-8',
        {
          '[&_[data-slot=button]]:opacity-0': loading,
          'w-11 px-0 data-[size=md]:w-9 data-[size=sm]:w-9 sm:w-10 sm:px-0 data-[size=md]:sm:w-9 data-[size=sm]:sm:w-8':
            iconOnly
        },
        className
      )}
      type={type}
      disabled={loading || disabled}
      data-size={size}
      {...restProps}
    >
      <div className="flex w-full items-center justify-center gap-x-2" data-slot="button">
        {children}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" data-slot="loader">
          <Loader />
        </div>
      )}
    </button>
  )
}

const GhostButton: FC<ButtonProps> = ({ className, ...restProps }) => (
  <ButtonComponent
    className={cn(
      'border border-input bg-foreground text-primary hover:bg-accent-light',
      className
    )}
    {...restProps}
  />
)

const LinkButton: FC<ButtonProps> = ({ className, ...restProps }) => (
  <ButtonComponent
    className={cn(
      'border-0 bg-transparent text-primary outline-0 hover:bg-accent-light hover:outline-0 aria-expanded:bg-accent-light',
      className
    )}
    {...restProps}
  />
)

export const CopyButton: FC<CopyButtonProps> = ({
  className,
  text,
  icon,
  label,
  duration = 3_000,
  ...restProps
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, duration)
  }

  if (icon) {
    return (
      <CopyToClipboard text={text} onCopy={handleCopy}>
        <Button.Link className={className} iconOnly onClick={preventDefault} {...restProps}>
          <Tooltip
            label={label}
            contentProps={{
              sideOffset: 12
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              {copied ? <IconCheck className="h-5 w-5" /> : icon}
            </div>
          </Tooltip>
        </Button.Link>
      </CopyToClipboard>
    )
  }

  return (
    <CopyToClipboard text={text} onCopy={handleCopy}>
      <Button className={cn('min-w-20', className)} onClick={preventDefault} {...restProps}>
        {copied ? t('components.copied') : t('components.copy')}
      </Button>
    </CopyToClipboard>
  )
}

export const CopyButton2: FC<Omit<CopyButtonProps, 'icon'>> = ({
  className,
  text,
  label,
  duration = 3_000,
  ...restProps
}) => {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, duration)
  }

  return (
    <CopyToClipboard text={text} onCopy={handleCopy}>
      <Button className={className} onClick={preventDefault} {...restProps}>
        {copied ? <IconCheck className="h-5 w-5" /> : <IconCopy className="h-5 w-5" />}
        <span>{label}</span>
      </Button>
    </CopyToClipboard>
  )
}

export const Button = Object.assign(ButtonComponent, {
  Ghost: GhostButton,
  Link: LinkButton,
  Copy: CopyButton,
  Copy2: CopyButton2
})
