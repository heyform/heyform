import { deepEqual, helper } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import FormComponent, { Field, FormProps } from 'rc-field-form'
import type { FieldProps } from 'rc-field-form/es/Field'
import { FC, ReactElement, ReactNode, cloneElement, useEffect, useState } from 'react'

import { cn } from '@/utils'

import { Button, ButtonProps } from './Button'

export interface FormItemProps extends FieldProps, Omit<ComponentProps, 'children' | 'onReset'> {
  isInline?: boolean
  label?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  hideRequiredMark?: boolean
}

const FormItem: FC<FormItemProps> = ({
  className,
  name,
  rules,
  isInline,
  validateTrigger = ['onSubmit'],
  label,
  description,
  footer,
  children,
  ...restProps
}) => {
  return (
    <Field
      name={name}
      rules={rules}
      validateFirst={false}
      validateTrigger={validateTrigger}
      {...restProps}
    >
      {(control, meta, form) => {
        const hasError = meta.errors.length > 0

        const props = {
          ...control,
          id: name,
          hasError
        }

        const childNode =
          typeof children === 'function'
            ? children(props, meta, form)
            : cloneElement(children as ReactElement, props)

        return (
          <div
            className={className}
            data-slot="item"
            data-name={name}
            data-error={hasError ? '' : undefined}
          >
            <div
              className={cn('w-full', isInline ? 'flex gap-x-8' : 'space-y-1')}
              data-slot="control"
            >
              <div
                className={cn({
                  'flex-1': isInline
                })}
                data-slot="info"
              >
                {label && (
                  <label
                    htmlFor={name as string}
                    className="select-none text-base/6 font-medium sm:text-sm/6"
                    data-slot="label"
                  >
                    {label}
                  </label>
                )}
                {description && (
                  <div className="text-base/5 text-secondary sm:text-sm/5" data-slot="description">
                    {description}
                  </div>
                )}
              </div>
              <div data-slot="content">{childNode}</div>
            </div>

            {hasError ? (
              <div className="mt-1 text-sm/6 text-error" data-slot="error">
                {meta.errors[0]}
              </div>
            ) : (
              footer && (
                <div className="mt-1 text-sm text-secondary" data-slot="footer">
                  {footer}
                </div>
              )
            )}
          </div>
        )
      }}
    </Field>
  )
}

export interface SimpleFormProps extends Partial<FormProps> {
  submitOnChangedOnly?: boolean
  showFetchError?: boolean
  submitProps: Partial<ButtonProps> & {
    label: string
  }
  fetch?: (values: any) => Promise<Any>
  refreshDeps?: any[]
  onLoadingChange?: (loading: boolean) => void
  onFinish?: (values: any) => void
}

const SimpleForm: FC<SimpleFormProps> = ({
  className,
  submitOnChangedOnly = false,
  showFetchError = true,
  submitProps: { label, ...restSubmitProps },
  fetch,
  refreshDeps = [],
  children,
  onLoadingChange,
  onValuesChange,
  onFinish,
  ...restProps
}) => {
  const [disabled, setDisabled] = useState(submitOnChangedOnly)

  const { loading, error, runAsync } = useRequest(fetch!, {
    manual: true,
    refreshDeps: [fetch, ...refreshDeps]
  })

  async function handleFinish(values: any) {
    if (onFinish) {
      onFinish(values)
    } else {
      await runAsync(values)
    }
  }

  function handleValuesChange(changes: any, values: any) {
    if (submitOnChangedOnly) {
      setDisabled(
        deepEqual(restProps.initialValues!, values) && helper.isValid(restProps.initialValues)
      )
    }

    onValuesChange?.(changes, values)
  }

  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  return (
    <Form
      className={className}
      onValuesChange={handleValuesChange}
      onFinish={handleFinish}
      {...restProps}
    >
      {children as Any}

      <div data-slot="submit">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
          data-slot="submit-button"
          {...restSubmitProps}
        >
          {label}
        </Button>
      </div>

      {showFetchError && error && !loading && (
        <div className="!mt-1 text-sm/6 text-error" data-slot="form-error">
          {error.message}
        </div>
      )}
    </Form>
  )
}

export const Form = Object.assign(FormComponent, {
  Item: FormItem,
  Simple: SimpleForm
})
