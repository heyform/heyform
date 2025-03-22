import { helper, toDuration, toFixed } from '@heyform-inc/utils'
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Select, Skeleton } from '@/components'
import { FormService } from '@/services'
import { useParam } from '@/utils'

interface TrendIndicatorProps {
  change: number | null
  label: string
}

const ANALYTIC_RANGES = [
  {
    label: 'form.analytics.7d',
    value: '7d'
  },
  {
    label: 'form.analytics.1m',
    value: '1m'
  },
  {
    label: 'form.analytics.3m',
    value: '3m'
  },
  {
    label: 'form.analytics.6m',
    value: '6m'
  },
  {
    label: 'form.analytics.1y',
    value: '1y'
  }
]

const TrendIndicator: FC<TrendIndicatorProps> = ({ change, label }) => {
  const { t } = useTranslation()

  if (helper.isNull(change)) {
    return null
  }

  return (
    <div className="mt-1 flex items-center gap-1.5 text-sm/6 sm:text-xs/6">
      {change! > 0 ? (
        <IconTrendingUp className="h-4 w-4 text-green-600" />
      ) : (
        <IconTrendingDown className="h-4 w-4 text-red-600" />
      )}
      <span className="text-secondary">
        {t(label, {
          change: (change! > 0 ? '+' : '') + toFixed(change!)
        })}
      </span>
    </div>
  )
}

export default function FormAnalyticsOverview() {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [range, setRange] = useState('7d')

  const { loading, data } = useRequest(
    async () => {
      return FormService.analytic(formId, range)
    },
    {
      refreshDeps: [formId, range]
    }
  )

  return (
    <>
      <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="text-base/6 font-semibold">{t('dashboard.overview')}</h2>
        <Select
          className="w-full sm:w-40"
          value={range}
          options={ANALYTIC_RANGES}
          placeholder={t('form.analytics.7d')}
          disabled={loading}
          multiLanguage
          onChange={setRange}
        />
      </div>

      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-base/6 font-medium sm:text-sm/6">{t('form.analytics.views')}</div>
          <Skeleton
            className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-16 [&_[data-slot=skeleton]]:sm:h-6"
            loading={loading}
          >
            <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
              {data?.totalVisits.value}
            </div>
          </Skeleton>

          <Skeleton
            className="mt-1 h-6 [&_[data-slot=skeleton]]:h-[0.875rem] [&_[data-slot=skeleton]]:w-40 [&_[data-slot=skeleton]]:sm:h-3"
            loading={loading}
          >
            <TrendIndicator
              change={data?.totalVisits.change}
              label={`form.analytics.${range}Trend`}
            />
          </Skeleton>
        </div>

        <div>
          <div className="text-base/6 font-medium sm:text-sm/6">{t('form.submissions.title')}</div>
          <Skeleton
            className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-16 [&_[data-slot=skeleton]]:sm:h-6"
            loading={loading}
          >
            <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
              {data?.submissionCount.value}
            </div>
          </Skeleton>

          <Skeleton
            className="mt-1 h-6 [&_[data-slot=skeleton]]:h-[0.875rem] [&_[data-slot=skeleton]]:w-40 [&_[data-slot=skeleton]]:sm:h-3"
            loading={loading}
          >
            <TrendIndicator
              change={data?.submissionCount.change}
              label={`form.analytics.${range}Trend`}
            />
          </Skeleton>
        </div>

        <div>
          <div className="text-base/6 font-medium sm:text-sm/6">
            {t('form.analytics.completeRate')}
          </div>
          <Skeleton
            className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-16 [&_[data-slot=skeleton]]:sm:h-6"
            loading={loading}
          >
            <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
              {`${toFixed(data?.completeRate.value || 0)}%`}
            </div>
          </Skeleton>

          <Skeleton
            className="mt-1 h-6 [&_[data-slot=skeleton]]:h-[0.875rem] [&_[data-slot=skeleton]]:w-40 [&_[data-slot=skeleton]]:sm:h-3"
            loading={loading}
          >
            <TrendIndicator
              change={data?.completeRate.change}
              label={`form.analytics.${range}Trend`}
            />
          </Skeleton>
        </div>

        <div>
          <div className="text-base/6 font-medium sm:text-sm/6">
            {t('form.analytics.averageDuration')}
          </div>
          <Skeleton
            className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-16 [&_[data-slot=skeleton]]:sm:h-6"
            loading={loading}
          >
            <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
              {toDuration(Math.round(data?.averageTime.value || 0))}
            </div>
          </Skeleton>

          <Skeleton
            className="mt-1 h-6 [&_[data-slot=skeleton]]:h-[0.875rem] [&_[data-slot=skeleton]]:w-40 [&_[data-slot=skeleton]]:sm:h-3"
            loading={loading}
          >
            <TrendIndicator
              change={data?.averageTime.change}
              label={`form.analytics.${range}Trend`}
            />
          </Skeleton>
        </div>
      </div>
    </>
  )
}
