import { diff, helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import type { FormProps as RcFieldFormProps } from 'rc-field-form'
import RcFieldForm from 'rc-field-form'
import type { FC } from 'react'
import { useState } from 'react'

import type { ButtonProps } from '../button/Button'
import Button from '../button/Button'

export interface CustomFormProps extends Partial<RcFieldFormProps> {
  inline?: boolean
  onlySubmitOnValueChange?: boolean
  showRequestError?: boolean
  submitText?: string
  submitOptions?: Partial<ButtonProps>
  request: (values: any) => Promise<any>
}

const CustomForm: FC<CustomFormProps> = ({
  className,
  inline,
  onlySubmitOnValueChange = false,
  showRequestError = true,
  submitText,
  request,
  submitOptions,
  children,
  onValuesChange,
  ...restProps
}) => {
  const [disabled, setDisabled] = useState(onlySubmitOnValueChange)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function handleFinish(values: any) {
    if (loading) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await request(values)
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  function handleValuesChange(changedValues: any, values: any) {
    if (onlySubmitOnValueChange) {
      setDisabled(helper.isEmpty(diff(restProps.initialValues!, values)))
    }

    onValuesChange?.(changedValues, values)
  }

  return (
    <div className="form-container">
      <RcFieldForm
        className={clsx(
          {
            'form-inline': inline
          },
          className
        )}
        onValuesChange={handleValuesChange}
        onFinish={handleFinish}
        {...restProps}
      >
        <>
          {children}

          <Button
            className="form-submit-button"
            htmlType="submit"
            loading={loading}
            disabled={loading || disabled}
            {...submitOptions}
          >
            {submitText}
          </Button>
        </>
      </RcFieldForm>
      {showRequestError && error && <div className="form-item-error">{error.message}</div>}
    </div>
  )
}

export default CustomForm
