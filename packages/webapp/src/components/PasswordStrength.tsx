import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Tooltip } from '@/components'
import { cn } from '@/utils'

function getPasswordStrength(password?: string) {
  let strength = 0

  if (helper.isEmpty(password)) {
    return strength
  }

  if (password!.length >= 8) {
    strength += 1
  }

  if (/[a-z]/.test(password!)) {
    strength += 1
  }

  if (/[A-Z]/.test(password!)) {
    strength += 1
  }

  if (/\d/.test(password!)) {
    strength += 1
  }

  return strength
}

export const PasswordStrength: FC<{ password?: string } & ComponentProps> = ({
  className,
  password
}) => {
  const { t } = useTranslation()

  const maxStrength = 4
  const children = useMemo(() => {
    const strength = getPasswordStrength(password)

    return Array.from({ length: maxStrength }).map((_, index) => (
      <div
        key={index}
        className={cn('h-[3px] w-2.5 rounded-[2px]', index < strength ? 'bg-primary' : 'bg-input')}
      />
    ))
  }, [password])

  return (
    <Tooltip
      label={t('components.password.invalid')}
      contentProps={{
        className: 'max-w-xs text-center'
      }}
    >
      <div className={cn('flex items-center gap-x-1 py-2', className)}>{children}</div>
    </Tooltip>
  )
}
