import clsx from 'clsx'
import { FC, useMemo } from 'react'

import { CUSTOM_FIELDS_CONFIGS, FIELD_CONFIGS } from '@/pages/form/Create/views/FieldConfig'

import { SheetKindIconProps } from './types'

const configs = [...FIELD_CONFIGS, ...CUSTOM_FIELDS_CONFIGS]

export const SheetKindIcon: FC<SheetKindIconProps> = ({ className, kind }) => {
  const config = useMemo(() => configs.find(c => c.kind === kind)!, [kind])

  return (
    <config.icon
      className={clsx('rounded', className)}
      style={{
        backgroundColor: config?.backgroundColor,
        color: config?.textColor
      }}
    />
  )
}
