import { NumberPrice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconChevronRight } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { startTransition, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Input, Select, notification } from '@/components/ui'
import { CURRENCY_OPTIONS } from '@/pages/form/Create/consts'
import { useStoreContext } from '@/pages/form/Create/store'
import { PaymentService } from '@/service'
import { useStore } from '@/store'
import { useParam, useVisible } from '@/utils'

import type { IBasicProps } from './Basic'
import { ConnectStripeModal } from './ConnectStripeModal'

export const Payment: FC<IBasicProps> = observer(({ field }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()
  const { formId } = useParam()
  const formStore = useStore('formStore')

  const [loading, setLoading] = useState(false)
  const [visible, openModal, closeModal] = useVisible()

  const price = useMemo(() => {
    let price = 0

    if (helper.isValid(field.properties?.price)) {
      if (field.properties!.price!.type === 'number') {
        price = (field.properties!.price as NumberPrice).value || 0
      }
    }

    return price
  }, [field.properties?.price])

  function handlePriceChange(price: any) {
    startTransition(() => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            properties: {
              ...field.properties,
              price: {
                ...field.properties?.price,
                value: price
              } as any
            }
          }
        }
      })
    })
  }

  function handleCurrencyChange(currency: any) {
    startTransition(() => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            properties: {
              ...field.properties,
              currency
            }
          }
        }
      })
    })
  }

  async function handleRevoke() {
    setLoading(true)

    try {
      await PaymentService.revokeStripeAccount(formId)

      formStore.update({
        stripeAccount: undefined
      })
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    setLoading(false)
  }

  const handlePriceChangeCallback = useCallback(handlePriceChange, [field.properties])
  const handleCurrencyChangeCallback = useCallback(handleCurrencyChange, [field.properties])

  return (
    <>
      {formStore.current?.stripeAccount?.accountId ? (
        <div className="right-sidebar-settings-item revoke-stripe-connect">
          <div className="flex items-center justify-between">
            <label className="form-item-label">Stripe account</label>
            <Button loading={loading} onClick={handleRevoke}>
              Revoke
            </Button>
          </div>
          <div className="mt-2 rounded bg-slate-100 p-2">
            {formStore.current?.stripeAccount?.email}
          </div>
        </div>
      ) : (
        <div className="right-sidebar-group-title">
          <Button.Link className="connect-stripe" onClick={openModal}>
            <div className="flex items-center justify-between">
              <span>{t('formBuilder.ConnectStripe')}</span>
              <IconChevronRight className="h-5 w-5 text-slate-500" />
            </div>
          </Button.Link>
        </div>
      )}

      <div className="right-sidebar-settings-item">
        <label className="form-item-label">{t('formBuilder.price')}</label>
        <Input className="mt-1" type="number" value={price} onChange={handlePriceChangeCallback} />
      </div>

      <div className="right-sidebar-settings-item">
        <label className="form-item-label">{t('formBuilder.currency')}</label>
        <Select
          className="mt-1"
          value={field.properties?.currency?.toUpperCase() || 'USD'}
          options={CURRENCY_OPTIONS}
          onChange={handleCurrencyChangeCallback}
        />
      </div>

      <ConnectStripeModal visible={visible} onClose={closeModal} />
    </>
  )
})
