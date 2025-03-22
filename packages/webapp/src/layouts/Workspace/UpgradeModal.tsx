import { stopEvent } from '@heyform-inc/form-renderer'
import { unixDate } from '@heyform-inc/utils'
import { IconCheck } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import dayjs from 'dayjs'
import { FC, useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Async, Button, Loader, Modal, Repeat, Switch, useAlert } from '@/components'
import { BillingCycleEnum } from '@/consts'
import { PaymentService } from '@/services'
import { useAppStore, useModal, useWorkspaceStore } from '@/store'
import { PlanType } from '@/types'
import { cn, useParam } from '@/utils'

interface PlanItemProps {
  plan: PlanType
  billingCycle: BillingCycleEnum
}

const PLAN_FEATURE_COUNTS = {
  basic: 9,
  premium: 8,
  business: 6
}

const PlanItem: FC<PlanItemProps> = ({ plan, billingCycle }) => {
  const { t } = useTranslation()

  const alert = useAlert()
  const { workspaceId } = useParam()
  const { workspace, updateWorkspace } = useWorkspaceStore()
  const { openModal } = useAppStore()

  const price = useMemo(
    () => plan.prices.find(price => price.billingCycle === billingCycle)?.price,
    [plan.prices, billingCycle]
  )

  const { loading, run } = useRequest(
    async () => {
      window.location.href = await PaymentService.freeTrial(workspaceId, plan.id)
    },
    {
      refreshDeps: [workspaceId, plan.id],
      manual: true
    }
  )

  const handleUpgrade = useCallback(() => {
    openModal('PaymentModal', {
      plan,
      billingCycle
    })
  }, [billingCycle, openModal, plan])

  const handleDowngrade = useCallback(() => {
    alert({
      title: t('billing.downgrade.headline'),
      description: (
        <Trans
          t={t}
          i18nKey="billing.downgrade.subHeadline"
          components={{
            strong: <strong className="text-primary" />
          }}
          values={{
            workspaceName: workspace.name,
            planName: plan.name
          }}
        />
      ),
      cancelProps: {
        label: t('components.cancel')
      },
      confirmProps: {
        label: t('billing.downgrade.confirm'),
        className: 'bg-error text-primary-light dark:text-primary hover:bg-error'
      },
      fetch: async () => {
        const { sessionUrl } = await PaymentService.payment({
          teamId: workspaceId,
          planId: plan.id,
          billingCycle
        })

        if (sessionUrl) {
          return (window.location.href = sessionUrl)
        }

        updateWorkspace(workspaceId, {
          plan
        })
      }
    })
  }, [alert, billingCycle, plan, t, updateWorkspace, workspace.name, workspaceId])

  const children = useMemo(() => {
    const grade = workspace?.plan.grade

    if (workspace?.subscription.trialing) {
      if (plan.grade === grade) {
        return (
          <div className="flex flex-col gap-2">
            <Button.Ghost className="w-full" disabled>
              {t('billing.upgrade.trialing')}
            </Button.Ghost>
            <div className="flex items-center justify-center text-sm">
              <span>
                {t('billing.upgrade.remaining', {
                  count: unixDate(workspace.trialEndAt).diff(dayjs(), 'day')
                })}
              </span>
              <span className="mx-1.5">·</span>
              <Button.Link className="!p-0 underline hover:bg-transparent" onClick={handleUpgrade}>
                {t('billing.payment.confirm')}
              </Button.Link>
            </div>
          </div>
        )
      } else {
        return (
          <Button className="w-full" onClick={handleUpgrade}>
            {t('billing.upgrade.confirm')}
          </Button>
        )
      }
    } else {
      if (plan.grade > grade!) {
        return (
          <>
            <Button className="w-full" onClick={handleUpgrade}>
              {t('billing.upgrade.confirm')}
            </Button>

            {!workspace.trialEndAt && (
              <Button.Link
                className="!p-0 underline hover:bg-transparent"
                loading={loading}
                onClick={run}
              >
                {t('workspace.trial.startTrial')}
              </Button.Link>
            )}
          </>
        )
      } else if (plan.grade < grade!) {
        return (
          <Button className="w-full" onClick={handleDowngrade}>
            {t('billing.downgrade.confirm')}
          </Button>
        )
      } else {
        return <Button.Ghost disabled>{t('billing.subscription.headline')}</Button.Ghost>
      }
    }
  }, [
    workspace?.plan.grade,
    workspace?.subscription.trialing,
    workspace.trialEndAt,
    plan.grade,
    t,
    handleUpgrade,
    handleDowngrade
  ])

  return (
    <div className="justify-self-stretch rounded-2xl border border-input px-6 py-5 lg:min-w-[18.75rem]">
      <div className="flex h-full flex-col">
        <div className="text-base font-bold uppercase">{plan.name}</div>
        <div className="mb-4 mt-2 text-3xl font-bold">
          ${price}/<span className="text-2xl">{t('billing.month')}</span>
        </div>

        {children}

        <div className="mt-4 flex-1 space-y-2 border-t border-input pt-4">
          <Repeat count={(PLAN_FEATURE_COUNTS as AnyMap)[plan.name.toLowerCase()]}>
            {(index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm text-primary">
                <IconCheck className="h-4 w-4 text-blue-600" />
                <span>{t(`billing.features.${plan.name.toLowerCase()}.${index}`)}</span>
              </div>
            )}
          </Repeat>
        </div>
      </div>
    </div>
  )
}

const UpgradeModalComponent: FC<{ isBillingPage?: boolean }> = ({ isBillingPage }) => {
  const { t } = useTranslation()

  const { workspace } = useWorkspaceStore()

  const [plans, setPlans] = useState<PlanType[]>([])
  const [billingCycle, setBillingCycle] = useState<BillingCycleEnum>(
    workspace?.subscription.billingCycle || BillingCycleEnum.ANNUALLY
  )

  const isAnnually = useMemo(() => billingCycle === BillingCycleEnum.ANNUALLY, [billingCycle])

  async function fetch() {
    const result = await PaymentService.plans()

    setPlans(result)
    return result.length > 0
  }

  function handleBillingCycleChange(value: boolean) {
    setBillingCycle(value ? BillingCycleEnum.ANNUALLY : BillingCycleEnum.MONTHLY)
  }

  return (
    <div className="sm:flex sm:h-full sm:items-center sm:justify-center">
      <div className="mx-auto sm:max-w-6xl sm:p-0">
        <div className="py-20">
          <div className="space-y-4">
            <h1 className="text-center text-4xl font-bold sm:tracking-tight">
              {isBillingPage ? t('billing.plans.headline') : t('billing.upgrade.headline')}
            </h1>
            <p className="mx-auto max-w-3xl text-center text-base text-secondary">
              {isBillingPage ? (
                <Trans
                  t={t}
                  i18nKey="billing.plans.subHeadline"
                  components={{
                    strong: <strong className="text-primary" />
                  }}
                  values={{
                    workspaceName: workspace.name,
                    planName: workspace.plan.name
                  }}
                />
              ) : (
                t('billing.upgrade.subHeadline')
              )}
            </p>
          </div>

          <Async
            fetch={fetch}
            loader={
              <div className="mt-40 flex justify-center">
                <Loader />
              </div>
            }
          >
            <div className="mt-6">
              <div className="mb-12 flex items-center justify-center gap-4 text-sm/6 font-medium text-secondary">
                <span className={cn(!isAnnually && 'font-semibold text-primary')}>
                  {t('billing.cycles.1')}
                </span>

                <Switch value={isAnnually} onChange={handleBillingCycleChange} />

                <span>
                  <span className={cn(isAnnually && 'font-semibold text-primary')}>
                    {t('billing.cycles.2')}
                  </span>
                  <span className="ml-2 hidden text-xs text-error sm:inline-block">
                    ({t('billing.save16')})
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:justify-center">
                {plans.map(plan => (
                  <PlanItem key={plan.id} plan={plan} billingCycle={billingCycle} />
                ))}
              </div>
            </div>
          </Async>
        </div>
      </div>
    </div>
  )
}

export default function UpgradeModal() {
  const { isOpen, payload, onOpenChange } = useModal('UpgradeModal')

  return (
    <Modal
      open={isOpen}
      overlayProps={{
        className: 'bg-transparent'
      }}
      contentProps={{
        className:
          'scrollbar max-w-screen max-h-screen w-screen h-screen border-none rounded-none shadow-none bg-foreground focus:outline-none focus-visible:outline-none',
        forceMount: true,
        onEscapeKeyDown: stopEvent,
        onFocusOutside: stopEvent,
        onPointerDownOutside: stopEvent
      }}
      onOpenChange={onOpenChange}
    >
      <UpgradeModalComponent isBillingPage={payload?.isBillingPage} />
    </Modal>
  )
}
