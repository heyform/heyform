import { validateFields } from '@heyform-inc/answer-utils'
import type { FormField } from '@heyform-inc/shared-types-enums'
import { FieldKindEnum, NumberPrice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconChevronRight } from '@tabler/icons-react'
import Big from 'big.js'
import clsx from 'clsx'
import type { FormProps as RCFormProps } from 'rc-field-form'
import RCForm, { Field, useForm } from 'rc-field-form'
import type { FC, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { useKey } from '@/utils'

import { Submit } from '../components'
import { removeStorage, useStore } from '../store'
import { sliceFieldsByLogics, useTranslation, validateLogicField } from '../utils'

interface FormProps extends RCFormProps {
  field: FormField
  autoSubmit?: boolean
  isSubmitShow?: boolean
  submitButtonText?: string
  hideSubmitIfErrorOccurred?: boolean
  getValues?: (values: any) => any
  children?: ReactNode
}

const NextIcon = <IconChevronRight />

export const Form: FC<FormProps> = ({
  field,
  autoSubmit: rawAutoSubmit = false,
  isSubmitShow: rawSubmitShow = true,
  submitButtonText = 'Submit',
  validateTrigger: trigger,
  hideSubmitIfErrorOccurred = false,
  getValues,
  children,
  ...restProps
}) => {
  const [form] = useForm<any>()
  const { t } = useTranslation()
  const { state, dispatch } = useStore()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>()

  const autoSubmit = useMemo(
    () => (state.alwaysShowNextButton ? false : rawAutoSubmit),
    [rawAutoSubmit, state.alwaysShowNextButton]
  )

  const validateTrigger = trigger ? trigger : autoSubmit ? 'onChange' : 'onSubmit'
  const isLastBlock = useMemo(
    () => state.scrollIndex! >= state.fields.length - 1,
    [state.fields.length, state.scrollIndex]
  )

  const initialValues = getValues ? getValues(restProps.initialValues) : restProps.initialValues
  const isSubmitShow = useMemo(
    () => rawSubmitShow || state.alwaysShowNextButton,
    [rawSubmitShow, state.alwaysShowNextButton]
  )
  const submitVisible = useMemo(
    () =>
      hideSubmitIfErrorOccurred && !isSubmitShow
        ? false
        : helper.isValid(initialValues) || isSubmitShow,
    [initialValues, isSubmitShow, hideSubmitIfErrorOccurred]
  )

  const isSkipable = useMemo(() => {
    return !field.validations?.required && field.kind !== 'statement' && field.kind !== 'group'
  }, [])

  async function handleFinish(formValue: any) {
    const value = getValues ? getValues(formValue) : formValue

    if (helper.isValid(value)) {
      dispatch({
        type: 'setValues',
        payload: {
          values: {
            [field.id]: value
          }
        }
      })
    }

    const values = { ...state.values, [field.id]: value }
    const isTouched = validateLogicField(field, state.jumpFieldIds, values)
    const isPartialSubmission = state.isScrollNextDisabled && !isTouched

    // Validate all form fields value
    if (isLastBlock || isPartialSubmission) {
      if (loading) {
        return
      }

      if (isLastBlock) {
        dispatch({
          type: 'setIsSubmitTouched',
          payload: {
            isSubmitTouched: true
          }
        })
      }

      setSubmitError(undefined)

      const fields = isPartialSubmission
        ? sliceFieldsByLogics(state.fields, state.jumpFieldIds)
        : state.fields

      try {
        validateFields(fields, values)
        setLoading(true)

        // 修改 payment value
        if (state.stripe) {
          const paymentField = state.fields.find(f => f.kind === FieldKindEnum.PAYMENT)

          if (paymentField) {
            const value = values[paymentField.id]

            if (helper.isValid(value)) {
              const price = paymentField.properties?.price as NumberPrice
              const currency = paymentField.properties?.currency

              if (!helper.isValid(price?.value) || price.value <= 0 || !helper.isValid(currency)) {
                values[paymentField.id] = undefined
              } else {
                values[paymentField.id] = {
                  amount: Big(price.value).times(100).toNumber(),
                  currency,
                  billingDetails: {
                    name: value.name
                  }
                }
              }
            }
          }
        }

        // Submit form
        await state.onSubmit?.(values, isPartialSubmission, state.stripe)

        setLoading(false)
        dispatch({
          type: 'setIsSubmitted',
          payload: {
            isSubmitted: true
          }
        })

        // Clear storage cache
        removeStorage(state.formId)
      } catch (err: any) {
        console.error(err, err?.response)
        setLoading(false)

        if (helper.isValid(err?.response?.id)) {
          dispatch({
            type: 'scrollToField',
            payload: {
              fieldId: err?.response?.id,
              scrollToField: err?.response?.id
            }
          })
        } else {
          setSubmitError(err?.message)
        }
      }

      return
    }

    // If the user submits once, verify the form data every time before scroll to next question
    if (state.isSubmitTouched) {
      try {
        validateFields(state.fields, values)
      } catch (err: any) {
        console.error(err, err?.response)
        dispatch({
          type: 'scrollToField',
          payload: {
            fieldId: err.response?.id,
            scrollToField: err?.response?.id
          }
        })

        return
      }
    }

    // Navigate to next form field
    dispatch({ type: 'scrollNext' })
  }

  function handleValuesChange(changes: any, values: any) {
    restProps.onValuesChange?.(changes, values)

    if (autoSubmit) {
      if (isLastBlock) {
        const value = getValues ? getValues(changes) : changes

        if (helper.isValid(value)) {
          dispatch({
            type: 'setValues',
            payload: {
              values: {
                [field.id]: value
              }
            }
          })
        }
      } else {
        setTimeout(() => form.submit(), 500)
      }

      return
    }

    // Rc-field-form doesn't provide any way to clear errors,
    // so it can only be done in the following disgraceful way.
    // see https://github.com/ant-design/ant-design/issues/24599#issuecomment-653292811
    Object.keys(values).forEach(name => {
      const error = form.getFieldError(name)

      if (error.length > 0) {
        form.setFields([
          {
            name,
            errors: []
          }
        ])
      }
    })
  }

  function handleSkip() {
    dispatch({ type: 'scrollNext' })
  }

  useKey('Enter', (event: KeyboardEvent) => {
    if (window.heyform.device.mobile) {
      return event.preventDefault()
    }

    form.submit()
  })

  useEffect(() => {
    if (field.id === state.errorFieldId) {
      form.validateFields()
      dispatch({
        type: 'resetErrorField'
      })
    }
  }, [state.errorFieldId])

  return (
    <RCForm
      className={clsx('heyform-form', {
        'heyform-form-last': isLastBlock
      })}
      autoComplete="off"
      form={form}
      validateTrigger={validateTrigger}
      onValuesChange={handleValuesChange}
      onFinish={handleFinish}
      {...restProps}
    >
      {children}

      {/* Submit */}
      {isLastBlock || state.isScrollNextDisabled ? (
        <>
          {submitError && (
            <div className="heyform-validation-wrapper">
              <div className="heyform-validation-error">{submitError}</div>
            </div>
          )}
          <Field shouldUpdate={true}>
            <Submit text={t('Submit')} loading={loading} />
          </Field>
          {isLastBlock && (
            <div className="heyform-submit-warn">
              {t('Never submit passwords!')} -{' '}
              <a
                href={state.reportAbuseURL || 'https://docs.heyform.net/report-abuse'}
                target="_blank"
              >
                {t('Report Abuse')}
              </a>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 flex items-center gap-2">
          {submitVisible && (
            <Field shouldUpdate={true}>
              {state.alwaysShowNextButton ? (
                <Submit className="!mt-0" text={t('Next')} icon={NextIcon} />
              ) : (
                (_, __, { getFieldsError }) => {
                  return (
                    !getFieldsError().some(({ errors }) => errors.length) && (
                      <Submit className="!mt-0" text={t('Next')} icon={NextIcon} />
                    )
                  )
                }
              )}
            </Field>
          )}
          {isSkipable && (
            <button className="heyform-skip-button" onClick={handleSkip}>
              {t('Skip')}
            </button>
          )}
        </div>
      )}
    </RCForm>
  )
}
