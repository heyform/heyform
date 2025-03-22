import { IconX } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import Big from 'big.js'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input, Modal } from '@/components'
import { BillingCycleEnum } from '@/consts'
import { PaymentService } from '@/services'
import { useModal, useWorkspaceStore } from '@/store'
import { PlacePriceType } from '@/types'
import { useParam } from '@/utils'

const PaymentComponent = () => {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { isOpen, payload, update, onOpenChange } = useModal('PaymentModal')
  const { updateWorkspace } = useWorkspaceStore()

  const [discount, setDiscount] = useState<Big | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)

  const price = useMemo(() => {
    const result = new Big(
      payload?.plan?.prices.find(
        (row: PlacePriceType) => row.billingCycle === payload?.billingCycle
      )?.price || 0
    )

    if (payload?.billingCycle === BillingCycleEnum.ANNUALLY) {
      return result.times(12)
    }

    return result
  }, [payload?.plan?.prices, payload?.billingCycle])

  const {
    loading: couponLoading,
    error: couponError,
    run: applyCoupon
  } = useRequest(
    async ({ code }: AnyMap) => {
      const { amountOff, percentOff } = await PaymentService.applyCoupon({
        teamId: workspaceId,
        planId: payload?.plan.id,
        billingCycle: payload?.billingCycle,
        code
      })

      if (amountOff) {
        setDiscount(new Big(amountOff).div(100))
      } else if (percentOff) {
        setDiscount(new Big(percentOff).div(100).times(price))
      }

      setCouponCode(code)
    },
    {
      manual: true,
      refreshDeps: [workspaceId, payload?.plan.id, payload?.billingCycle]
    }
  )

  const {
    loading: paymentLoading,
    error: paymentError,
    run: makePayment
  } = useRequest(
    async () => {
      const result = await PaymentService.payment({
        teamId: workspaceId,
        planId: payload?.plan.id,
        billingCycle: payload?.billingCycle,
        code: couponCode
      })

      if (result.sessionUrl) {
        return (window.location.href = result.sessionUrl)
      }

      updateWorkspace(workspaceId, {
        plan: payload?.plan
      })
      onOpenChange(false)
    },
    {
      manual: true,
      refreshDeps: [workspaceId, payload?.plan.id, payload?.billingCycle, couponCode]
    }
  )

  const total = useMemo(() => {
    if (discount) {
      const t = price.minus(discount)

      if (t.toNumber() > 0) {
        return t.toFixed(2)
      } else {
        return '0.00'
      }
    } else {
      return price.toFixed(2)
    }
  }, [discount, price])

  useEffect(() => {
    update({
      loading: couponLoading || paymentLoading
    })
  }, [couponLoading, paymentLoading])

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className: 'max-w-md',
        forceMount: true
      }}
      onOpenChange={onOpenChange}
    >
      <div className="text-sm/6">
        <h2 className="text-lg font-semibold">{t('billing.payment.headline')}</h2>

        <div className="mt-6 flex justify-between space-x-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t('billing.planName', { name: payload?.plan.name })}</p>
            <p className="text-xs text-secondary">{t(`billing.cycles.${payload?.billingCycle}`)}</p>
          </div>
          <div className="flex-shrink-0 whitespace-nowrap">${price.toFixed(2)}</div>
        </div>

        <div className="mt-4">
          {couponCode ? (
            <div className="flex items-center justify-between rounded-lg border border-input bg-transparent py-[0.3125rem] pl-3.5 pr-1.5 text-base/[1.4rem] sm:py-[0.1875rem] sm:pl-3 sm:pr-1 sm:text-sm/[1.4rem]">
              <span>{couponCode}</span>
              <Button.Link
                className="text-secondary hover:text-primary"
                size="sm"
                iconOnly
                onClick={() => setCouponCode(null)}
              >
                <IconX className="h-5 w-5" />
              </Button.Link>
            </div>
          ) : (
            <>
              <Form.Simple
                className="[&_[data-slot=input]]:pr-30 relative"
                submitProps={{
                  className:
                    'absolute top-1/2 font-normal right-1.5 h-8 sm:h-7 -translate-y-1/2 px-1.5 sm:px-1.5 bg-transparent text-primary hover:bg-accent-light',
                  label: t('billing.payment.apply'),
                  loading: couponLoading
                }}
                onFinish={applyCoupon}
              >
                <Form.Item
                  name="code"
                  rules={[
                    {
                      required: true,
                      message: t('billing.payment.couponCode.required')
                    }
                  ]}
                >
                  <Input placeholder={t('billing.payment.couponCode.label')} />
                </Form.Item>
              </Form.Simple>

              {couponError && !couponLoading && !paymentLoading && (
                <div className="mt-1 text-error">{couponError.message}</div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-secondary">
            <span>{t('billing.payment.subtotal')}</span>
            <span className="text-primary">${price.toFixed(2)}</span>
          </div>

          {discount && (
            <div className="flex justify-between text-secondary">
              <span>{t('billing.payment.discount')}</span>
              <span className="text-green-600">-${discount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-6">
          <div className="flex justify-between border-t border-accent-light pt-3">
            <span>{t('billing.payment.total')}</span>
            <span>${total}</span>
          </div>

          <Button className="w-full" loading={paymentLoading} onClick={makePayment}>
            {t('billing.payment.confirm')}
          </Button>
        </div>

        {paymentError && !paymentLoading && !couponLoading && (
          <div className="mt-1 text-error">{paymentError.message}</div>
        )}
      </div>
    </Modal>
  )
}

export default function PaymentModal() {
  const { isOpen, payload, onOpenChange } = useModal('PaymentModal')

  return (
    <Modal
      open={isOpen}
      loading={payload?.loading}
      contentProps={{
        className: 'max-w-md',
        forceMount: true
      }}
      onOpenChange={onOpenChange}
    >
      <PaymentComponent />
    </Modal>
  )
}
