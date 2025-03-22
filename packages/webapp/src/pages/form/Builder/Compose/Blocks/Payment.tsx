import { CURRENCY_SYMBOLS } from '@heyform-inc/form-renderer'
import { NumberPrice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconChevronRight } from '@tabler/icons-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeSubmit } from '../FakeSubmit'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const Payment: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

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

  return (
    <Block className="heyform-payment" field={field} locale={locale} {...restProps}>
      <div className="heyform-payment-header">
        <p>
          {t('Your credit card will be charged', { lng: locale })}: <strong>{priceString}</strong>
        </p>
      </div>

      <div className="heyform-payment-body">
        <div className="heyform-payment-item">
          <div className="heyform-payment-label">{t('Name on card', { lng: locale })}</div>
          <input type="text" className="heyform-input" placeholder="Han Solo" disabled={true} />
        </div>

        <div className="heyform-payment-item">
          <div className="heyform-payment-label">{t('Card number', { lng: locale })}</div>
          <input
            type="text"
            className="heyform-input"
            placeholder="1234 1234 1234 1234"
            disabled={true}
          />
        </div>

        <div className="heyform-payment-wrapper">
          <div className="heyform-payment-item">
            <div className="heyform-payment-label">{t('Expiry date', { lng: locale })}</div>
            <input type="text" className="heyform-input" placeholder="MM/YY" disabled={true} />
          </div>
          <div className="heyform-payment-item">
            <div className="heyform-payment-label">{t('CVC', { lng: locale })}</div>
            <input type="text" className="heyform-input" placeholder="123" disabled={true} />
          </div>
        </div>
      </div>

      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
