import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import clsx from 'clsx'
import type { FC } from 'react'
import { useMemo } from 'react'

import { VARIABLE_KIND_CONFIGS } from '@/pages/form/Create/consts'

import { FIELD_CONFIGS, type FieldConfig } from './FieldConfig'

export interface FieldIconProps extends IComponentProps {
  configs?: FieldConfig[]
  kind: FieldKindEnum
  index?: number | string
  iconOnly?: boolean
}

export interface VariableIconProps extends Omit<FieldIconProps, 'index' | 'kind'> {
  kind: string
}

export const FieldIcon: FC<FieldIconProps> = ({
  configs = FIELD_CONFIGS,
  kind,
  index,
  iconOnly = true,
  className,
  style: rawStyle,
  ...restProps
}) => {
  const config = useMemo(() => {
    return configs.find(c => c.kind === kind)
  }, [kind])

  const style = useMemo(
    () => ({
      ...rawStyle,
      backgroundColor: config?.backgroundColor,
      color: config?.textColor
    }),
    [config?.backgroundColor, config?.textColor, rawStyle]
  )

  const iconStyle = useMemo(
    () => ({
      color: config?.textColor
    }),
    [config?.textColor]
  )

  return (
    <div
      className={clsx(
        'field-icon flex h-6 items-center justify-between rounded px-1.5',
        {
          'w-12': !iconOnly,
          'w-6': iconOnly
        },
        className
      )}
      style={style}
      {...restProps}
    >
      {config?.icon && <config.icon className="m-0 p-0" style={iconStyle} />}
      {!iconOnly && <span className="text-xs font-bold">{index}</span>}
    </div>
  )
}

export const VariableIcon: FC<VariableIconProps> = ({
  configs = FIELD_CONFIGS,
  kind,
  iconOnly = true,
  ...restProps
}) => {
  return (
    <FieldIcon
      configs={VARIABLE_KIND_CONFIGS}
      kind={kind as FieldKindEnum}
      iconOnly={iconOnly}
      {...restProps}
    />
  )
}
