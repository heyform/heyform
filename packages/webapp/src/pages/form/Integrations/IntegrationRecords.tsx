import { useRequest } from 'ahooks'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { IntegrationService } from '@/services'
import { timeFromNow } from '@/utils'

import { Badge } from '@/components'
import { INTEGRATION_RECORD_STATUS_ENUM } from '@/consts'
import { IntegrationRecordType } from '@/types'

// How many submissions wait for the integration to be reconnected
export const IntegrationWaitingCount: FC<{ count?: number; className?: string }> = ({
  count,
  className
}) => {
  const { t } = useTranslation()

  if (!count) {
    return null
  }

  return (
    <p className={className ?? 'text-secondary mt-1 text-sm'}>
      {t('form.integrations.records.waitingCount', { count })}
    </p>
  )
}

const RECORD_BADGES = {
  waiting: ['zinc', 'form.integrations.records.waiting'],
  succeeded: ['green', 'form.integrations.records.succeeded'],
  retrying: ['amber', 'form.integrations.records.retrying'],
  failed: ['red', 'form.integrations.records.failed']
} as const

function getRecordBadge(record: IntegrationRecordType) {
  switch (record.status) {
    case INTEGRATION_RECORD_STATUS_ENUM.WAITING:
      return RECORD_BADGES.waiting

    case INTEGRATION_RECORD_STATUS_ENUM.SUCCEEDED:
      return RECORD_BADGES.succeeded

    default:
      return record.willRetry ? RECORD_BADGES.retrying : RECORD_BADGES.failed
  }
}

export const IntegrationRecordList: FC<{ records: IntegrationRecordType[] }> = ({ records }) => {
  const { t, i18n } = useTranslation()

  if (!records.length) {
    return <p className="text-secondary mt-2 text-sm">{t('form.integrations.records.empty')}</p>
  }

  return (
    <ul className="divide-accent-light mt-2 max-h-64 divide-y overflow-y-auto text-sm">
      {records.map(record => {
        const succeeded = record.status === INTEGRATION_RECORD_STATUS_ENUM.SUCCEEDED
        const waiting = record.status === INTEGRATION_RECORD_STATUS_ENUM.WAITING
        const [color, label] = getRecordBadge(record)

        return (
          <li key={record.id} className="py-2" data-status={record.status}>
            <div className="flex items-center justify-between gap-x-2">
              <Badge color={color}>{t(label)}</Badge>
              <span className="text-secondary">{timeFromNow(record.createdAt, i18n.language)}</span>
            </div>

            {!waiting && record.maxAttempts > 1 && (record.attempt > 1 || !succeeded) && (
              <div className="text-secondary mt-1">
                {t('form.integrations.records.attempt', {
                  attempt: record.attempt,
                  maxAttempts: record.maxAttempts
                })}
              </div>
            )}

            {record.error && <div className="text-secondary mt-1 break-words">{record.error}</div>}
          </li>
        )
      })}
    </ul>
  )
}

// Recent delivery attempts of an existing integration
export default function IntegrationRecords({
  formId,
  appId,
  waitingCount
}: {
  formId: string
  appId: string
  waitingCount?: number
}) {
  const { t } = useTranslation()
  const { data } = useRequest(() => IntegrationService.records(formId, appId), {
    refreshDeps: [formId, appId]
  })

  return (
    <div className="mt-8">
      <h3 className="text-sm/6 font-medium">{t('form.integrations.records.title')}</h3>
      <IntegrationWaitingCount count={waitingCount} />
      {data && <IntegrationRecordList records={data} />}
    </div>
  )
}
