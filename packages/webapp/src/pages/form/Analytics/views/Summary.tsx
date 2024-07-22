import { clone, helper } from '@heyform-inc/utils'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SubHeading } from '@/components'
import { Select } from '@/components/ui'
import { FormAnalyticsSummary } from '@/models'
import { FormService } from '@/service'
import { useParam } from '@/utils'

interface SummaryItemProps extends IComponentProps {
  count?: string | number
  text?: string
}

const FORM_ANALYTICS_OPTIONS = [
  {
    value: 7,
    label: 'analytics.time.0'
  },
  {
    value: 30,
    label: 'analytics.time.1'
  },
  {
    value: 90,
    label: 'analytics.time.2'
  },
  {
    value: 365,
    label: 'analytics.time.3'
  }
]

const DEFAULT_SUMMARY_DATA = {
  totalVisits: 0,
  submissionCount: 0,
  completeRate: 0,
  averageDuration: '-'
}

function formatSeconds(t: number): string {
  if (t < 60) {
    return `${t}s`
  }

  const m = Math.floor(t / 60)
  const s = t % 60

  return `${m}m ${s}s`
}

const SummaryItem: FC<SummaryItemProps> = ({ count, text, ...restProps }) => {
  return (
    <div className="analytics-item-container md:mb-0" {...restProps}>
      <div className="analytics-item-wrapper rounded-lg bg-white p-4 md:px-9 md:py-8">
        <div className="mb-5 mt-3 text-base font-medium">{text}</div>
        <div className="text-xl font-medium">{count}</div>
      </div>
    </div>
  )
}

const Summary: FC = () => {
  const { t } = useTranslation()
  const { formId } = useParam()
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState(7)
  const [summary, setSummary] = useState<FormAnalyticsSummary>(DEFAULT_SUMMARY_DATA)

  const options = FORM_ANALYTICS_OPTIONS.map(row => ({
    ...row,
    label: t(row.label)
  }))

  async function fetchAnalytic() {
    if (loading) {
      return
    }

    setLoading(true)

    const result = await FormService.analytic(formId, range)

    if (helper.isValid(result)) {
      const _summary = {
        totalVisits: result.totalVisits,
        submissionCount: result.submissionCount,
        averageDuration: formatSeconds(result.averageTime),
        completeRate: 0
      }

      if (result.submissionCount && result.submissionCount > result.totalVisits) {
        _summary.completeRate = 100
      } else if (result.totalVisits) {
        _summary.completeRate = Math.ceil((result.submissionCount * 100) / result.totalVisits)
      }

      setSummary(_summary)
    }

    setLoading(false)
  }

  function handleRangeChange(range: any) {
    setRange(parseInt(range))
  }

  useEffect(() => {
    fetchAnalytic()
  }, [formId, range])

  return (
    <div>
      <SubHeading
        className="mb-5 flex items-center justify-between"
        action={
          <Select
            className="!w-auto"
            popupClassName="!w-[200px]"
            value={range}
            options={options as any}
            loading={loading}
            onChange={handleRangeChange}
          />
        }
      >
        {t('analytics.AnalyticsOverview')}
      </SubHeading>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        <SummaryItem count={summary.totalVisits} text={t('analytics.Views')} />
        <SummaryItem count={summary.submissionCount} text={t('analytics.Submissions')} />
        <SummaryItem count={`${summary.completeRate}%`} text={t('analytics.complete')} />
        <SummaryItem count={summary.averageDuration} text={t('analytics.Average')} />
      </div>
    </div>
  )
}

export default Summary
