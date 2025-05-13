import clsx from 'clsx'
import { FC, useMemo } from 'react'
import { IconNetwork } from '@tabler/icons-react'

import { CUSTOM_FIELDS_CONFIGS, FIELD_CONFIGS } from '@/pages/form/Create/views/FieldConfig'

import { SheetKindIconProps } from './types'

const configs = [...FIELD_CONFIGS, ...CUSTOM_FIELDS_CONFIGS]

// Add IP address icon configuration
const ipAddressConfig = {
  kind: 'ip_address',
  icon: IconNetwork,
  label: 'IP Address',
  textColor: '#0369a1',
  backgroundColor: '#e0f2fe'
}

export const SheetKindIcon: FC<SheetKindIconProps> = ({ className, kind }) => {
  const config = useMemo(() => {
    if (kind === 'ip_address') {
      return ipAddressConfig
    }
    return configs.find(c => c.kind === kind)
  }, [kind])

  if (!config) {
    // Fallback for unknown kinds
    return (
      <div
        className={clsx('rounded', className)}
        style={{
          backgroundColor: '#e5e7eb',
          color: '#334155'
        }}
      />
    )
  }

  return (
    <config.icon
      className={clsx('rounded', className)}
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor
      }}
    />
  )
}
