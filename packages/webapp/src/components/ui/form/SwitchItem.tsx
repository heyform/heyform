import clsx from 'clsx'
import { Field as RcField } from 'rc-field-form'
import type { FC, ReactNode } from 'react'

import Switch from '../switch'
import type { FormItemProps } from './FormItem'

export interface SwitchItemProps extends Omit<FormItemProps, 'extra'> {
  description?: ReactNode
}

const SwitchItem: FC<SwitchItemProps> = ({
  className,
  name,
  rules,
  validateTrigger = ['onSubmit'],
  label,
  description,
  ...restProps
}) => {
  return (
    <RcField
      name={name}
      rules={rules}
      validateFirst={false}
      validateTrigger={validateTrigger}
      {...restProps}
    >
      {(control, meta) => {
        const isHasError = meta.errors.length > 0
        const props: any = {
          ...control,
          id: name
        }

        return (
          <div
            className={clsx(
              'form-item form-switch-item',
              {
                'form-item-error': isHasError
              },
              className
            )}
            data-name={name}
          >
            <div className="form-switch-item-container">
              <div className="form-switch-item-left">
                {label && (
                  <label htmlFor={name as string} className="form-item-label">
                    {label}
                  </label>
                )}
                {description && <div className="form-item-description">{description}</div>}
              </div>
              <Switch {...props} />
            </div>
            {isHasError && <div className="form-item-error">{meta.errors[0]}</div>}
          </div>
        )
      }}
    </RcField>
  )
}

export default SwitchItem
