import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import { Field as RcField } from 'rc-field-form'
import type { FieldProps as RcFieldProps } from 'rc-field-form/es/Field'
import type { CSSProperties, FC, ReactElement, ReactNode } from 'react'
import { cloneElement } from 'react'

type ExtraFunction = (value: any) => ReactNode

export interface FormItemProps extends RcFieldProps {
  className?: string
  style?: CSSProperties
  label?: ReactNode
  description?: ReactNode
  extra?: ReactNode | ExtraFunction
  hideRequiredMark?: boolean
}

const FormItem: FC<FormItemProps> = ({
  className,
  name,
  rules,
  validateTrigger = ['onSubmit'],
  label,
  description,
  extra,
  children,
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
      {(control, meta, form) => {
        const isHasError = meta.errors.length > 0

        const props: any = {
          ...control,
          id: name,
          isHasError
        }

        const childNode =
          typeof children === 'function'
            ? children(props, meta, form)
            : cloneElement(children as ReactElement, props)

        return (
          <div
            className={clsx(
              'form-item',
              {
                'form-item-error': isHasError
              },
              className
            )}
            data-name={name}
          >
            {label && (
              <label htmlFor={name as string} className="form-item-label">
                {label}
              </label>
            )}
            {description && <div className="form-item-description">{description}</div>}
            <div className="form-item-content">{childNode}</div>
            {isHasError ? (
              <div className="form-item-error">{meta.errors[0]}</div>
            ) : (
              extra && (
                <div className="form-item-extra">
                  {helper.isFunction(extra)
                    ? (extra as ExtraFunction)(props.value)
                    : (extra as ReactNode)}
                </div>
              )
            )}
          </div>
        )
      }}
    </RcField>
  )
}

export default FormItem
