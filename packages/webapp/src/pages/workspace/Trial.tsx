import { IconCheck } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, Button, Loader, Repeat, Switch } from '@/components'
import { BillingCycleEnum } from '@/consts'
import { PaymentService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { PlanType } from '@/types'
import { cn, useParam, useRouter } from '@/utils'

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
  const { workspaceId } = useParam()

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

  return (
    <div className="justify-self-stretch rounded-2xl border border-input px-6 py-5 lg:min-w-[18.75rem]">
      <div className="flex h-full flex-col">
        <div className="text-base font-bold uppercase">{plan.name}</div>
        <div className="mb-4 mt-2 text-3xl font-bold">
          ${price}/<span className="text-2xl">{t('billing.month')}</span>
        </div>

        <Button loading={loading} onClick={run}>
          {t('workspace.trial.startTrial')}
        </Button>

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

export default function WorkspaceTrial() {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspace } = useWorkspaceStore()

  const [plans, setPlans] = useState<PlanType[]>([])
  const [billingCycle, setBillingCycle] = useState(BillingCycleEnum.MONTHLY)

  const isAnnually = useMemo(() => billingCycle === BillingCycleEnum.ANNUALLY, [billingCycle])

  async function fetch() {
    const result = await PaymentService.plans()

    setPlans(result)
    return result.length > 0
  }

  function handleBillingCycleChange(value: boolean) {
    setBillingCycle(value ? BillingCycleEnum.ANNUALLY : BillingCycleEnum.MONTHLY)
  }

  function handleSkip() {
    router.replace(`/workspace/${workspace?.id}/`)
  }

  useEffect(() => {
    if (workspace?.trialEndAt && workspace.trialEndAt > 0) {
      handleSkip()
    }
  }, [])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-foreground">
      <div className="mx-auto sm:max-w-6xl sm:p-0">
        <div className="px-4 py-20">
          <div className="flex flex-col items-center gap-y-4">
            <h1 className="text-center text-3xl/8 font-semibold sm:text-2xl/8">
              {t('workspace.trial.title')}
            </h1>
            <p className="text-center text-lg/6 text-secondary sm:text-base/6">
              {t('workspace.trial.subHeadline')}
            </p>

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
    </div>
  )
}
