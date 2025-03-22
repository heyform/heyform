import { NumberPrice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconArrowUpRight } from '@tabler/icons-react'
import { useBoolean, useRequest } from 'ahooks'
import { startTransition, useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button, Input, Select, useAlert } from '@/components'
import { PaymentService } from '@/services'
import { useFormStore } from '@/store'
import { useParam, useWindow } from '@/utils'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'form.builder.settings.payment.eur' },
  { value: 'GBP', label: 'form.builder.settings.payment.gbp' },
  { value: 'USD', label: 'form.builder.settings.payment.usd' },
  { value: 'AUD', label: 'form.builder.settings.payment.aud' },
  { value: 'CAD', label: 'form.builder.settings.payment.cad' },
  { value: 'CHF', label: 'form.builder.settings.payment.chf' },
  { value: 'NOK', label: 'form.builder.settings.payment.nok' },
  { value: 'SEK', label: 'form.builder.settings.payment.sek' },
  { value: 'DKK', label: 'form.builder.settings.payment.dkk' },
  { value: 'MXN', label: 'form.builder.settings.payment.mxn' },
  { value: 'NZD', label: 'form.builder.settings.payment.nzd' },
  { value: 'BRL', label: 'form.builder.settings.payment.brl' }
]

const POPUP_WINDOW_SOURCE = 'heyform-connect-stripe'

export default function PaymentSettings({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()

  const alert = useAlert()
  const { formId } = useParam()
  const { dispatch } = useStoreContext()
  const { form, updateForm } = useFormStore()

  const [connectLoading, { setTrue, setFalse }] = useBoolean(false)
  const [error, setError] = useState<Error>()

  const price = useMemo(() => {
    let value = 0

    if (helper.isValid(field.properties?.price)) {
      if (field.properties!.price!.type === 'number') {
        value = (field.properties!.price as NumberPrice).value || 0
      }
    }

    return value
  }, [field.properties])

  const openWindow = useWindow(
    POPUP_WINDOW_SOURCE,
    async (win, payload) => {
      win.close()

      if (payload.state && payload.code) {
        try {
          const stripeAccount = await PaymentService.connectStripe(
            formId,
            payload.state,
            payload.code
          )

          updateForm({
            stripeAccount
          })
        } catch (err: any) {
          setError(err)
        }

        setFalse()
      }
    },
    () => {
      setFalse()
    }
  )

  const { loading: authorizeLoading, run: authorizeRun } = useRequest(
    async () => {
      const url = await PaymentService.stripeAuthorizeUrl(formId)

      openWindow(url)
    },
    {
      refreshDeps: [formId],
      manual: true
    }
  )

  const { loading: revokeLoading, run: revokeRun } = useRequest(
    async () => {
      await PaymentService.revokeStripeAccount(formId)

      updateForm({
        stripeAccount: undefined
      })
    },
    {
      refreshDeps: [formId],
      manual: true
    }
  )

  function handleConnect() {
    setTrue()
    setError(undefined)

    alert({
      loading: authorizeLoading,
      title: t('form.builder.settings.payment.headline'),
      description: (
        <div className="space-y-2.5">
          <Trans
            t={t}
            i18nKey="form.builder.settings.payment.subHeadline"
            components={{
              div: <div />,
              a: <a className="text-primary underline" href="#" target="_blank" rel="noreferrer" />,
              button: (
                <Button.Link className="!h-auto !p-0 text-primary underline hover:bg-transparent" />
              )
            }}
          />
        </div>
      ),
      cancelProps: {
        label: t('components.cancel')
      },
      confirmProps: {
        label: t('form.builder.settings.payment.headline'),
        className: 'bg-error text-primary-light dark:text-primary hover:bg-error'
      },
      onConfirm: authorizeRun,
      onCancel: setFalse,
      onClose: setFalse
    })
  }

  const handlePriceChange = useCallback(
    (price: any) => {
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
                } as Any
              }
            }
          }
        })
      })
    },
    [dispatch, field.id, field.properties]
  )

  const handleCurrencyChange = useCallback(
    (currency: any) => {
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
    },
    [dispatch, field.id, field.properties]
  )

  if (!helper.isValid(form?.stripeAccount?.accountId)) {
    return (
      <div className="space-y-1">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.payment.title')}
        </label>

        <Button className="w-full" size="md" loading={connectLoading} onClick={handleConnect}>
          {t('form.builder.settings.payment.headline')}
          <IconArrowUpRight className="inline h-5 w-5" />
        </Button>

        {error && <div className="text-sm/6 text-error">{error.message}</div>}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.payment.stripeAccount')}
        </label>

        <div className="flex items-center justify-between">
          <span className="text-sm/6 font-medium">{form?.stripeAccount?.email}</span>
          <Button.Ghost size="sm" loading={revokeLoading} onClick={revokeRun}>
            {t('form.builder.settings.payment.revoke')}
          </Button.Ghost>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.payment.price')}
        </label>

        <Input type="number" min={0} value={price} onChange={handlePriceChange} />
      </div>

      <div className="space-y-1">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.payment.currency')}
        </label>

        <Select
          className="w-full"
          value={field.properties?.currency?.toUpperCase() || 'USD'}
          options={CURRENCY_OPTIONS}
          multiLanguage
          onChange={handleCurrencyChange}
        />
      </div>
    </>
  )
}
