import { NumberPrice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import { RuleObject, StoreValue } from 'rc-field-form/es/interface'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { FormField, Input } from '../components'
import { CURRENCY_SYMBOLS } from '../consts'
import { useStore } from '../store'
import { getStripeElementStyle } from '../theme'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

interface CardItemProps {
  type: 'cardNumber' | 'cardExpiry' | 'cardCvc'
  label: string
  value?: boolean
  onChange?: (value?: boolean) => void
}

const CardItem: FC<CardItemProps> = ({ type, label, onChange }) => {
  const { state } = useStore()
  const [ref, setRef] = useState<HTMLDivElement | null>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (ref && state.stripe) {
      const style = getStripeElementStyle(state.theme)
      let element = state.stripe.elements.getElement(type)

      if (!element) {
        element = state.stripe.elements.create(type, { style })
      }

      element.mount(ref)
      element.on('change', (event: any) => {
        if (event.empty) {
          return onChange?.(undefined)
        }

        if (event.error) {
          setError(event.error.message)
        } else {
          setError(undefined)
        }

        onChange?.(event.complete)
      })
    }
  }, [ref, state.stripe])

  return (
    <div className={clsx('heyform-payment-item', { 'heyform-payment-item-error': !!error })}>
      <label className="heyform-payment-label">{label}</label>
      <div ref={setRef} className="heyform-payment-element"></div>
      {error && (
        <div className="heyform-validation-wrapper">
          <div className="heyform-validation-error">{error}</div>
        </div>
      )}
    </div>
  )
}

export const Payment: FC<BlockProps> = ({ field, ...restProps }) => {
  const { t } = useTranslation()
  const [required, setRequired] = useState(field.validations?.required)

  const priceString = useMemo(() => {
    const currency = field.properties?.currency || 'USD'
    let price = 0

    if (helper.isValid(field.properties?.price)) {
      if (field.properties!.price!.type === 'number') {
        price = (field.properties!.price as NumberPrice).value || 0
      }
    }

    return CURRENCY_SYMBOLS[currency] + price
  }, [field.properties?.currency, field.properties?.price])

  function validate(values: any) {
    return (
      helper.isValid(values) &&
      (helper.isValid(values.name) ||
        helper.isValid(values.cardNumber) ||
        helper.isValid(values.cardExpiry) ||
        helper.isValid(values.cardCvc))
    )
  }

  function handleValuesChange(_: any, values: any) {
    setRequired(field.validations?.required || validate(values))
  }

  function validator(rule: RuleObject, value: StoreValue) {
    return new Promise<void>((resolve, reject) => {
      if (!rule.required) {
        return resolve()
      }

      if (helper.isTrue(value)) {
        resolve()
      } else {
        reject(new Error(rule.message as string))
      }
    })
  }

  function getValues(values: any) {
    return validate(values) ? values : undefined
  }

  return (
    <Block className="heyform-payment" field={field} {...restProps}>
      <div>
        <div className="heyform-payment-header">
          {t('Your credit card will be charged')}: <strong>{priceString}</strong>
        </div>

        <Form
          field={field}
          isSubmitShow={true}
          getValues={getValues}
          validateTrigger="onChange"
          onValuesChange={handleValuesChange}
        >
          <div className="heyform-payment-body">
            <FormField
              name="name"
              rules={[
                {
                  required,
                  message: t('Name on card is incomplete')
                }
              ]}
            >
              <div className="heyform-payment-item">
                <label className="heyform-payment-label">{t('Name on card')}</label>
                <Input placeholder={t('Han Solo')} />
              </div>
            </FormField>

            <FormField
              name="cardNumber"
              rules={[
                {
                  required,
                  message: t('Card number is incomplete'),
                  validator
                }
              ]}
            >
              <CardItem type="cardNumber" label={t('Card number')} />
            </FormField>

            <div className="heyform-payment-wrapper">
              <FormField
                name="cardExpiry"
                rules={[
                  {
                    required,
                    message: t('Expiry date is incomplete'),
                    validator
                  }
                ]}
              >
                <CardItem type="cardExpiry" label={t('Expiry date')} />
              </FormField>

              <FormField
                name="cardCvc"
                rules={[
                  {
                    required,
                    message: t('CVC is incomplete'),
                    validator
                  }
                ]}
              >
                <CardItem type="cardCvc" label={t('CVC')} />
              </FormField>
            </div>
          </div>
        </Form>
      </div>
    </Block>
  )
}
