import { useRequest } from 'ahooks'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { IntegrationService } from '@/services'
import { timeFromNow } from '@/utils'

import { Badge } from '@/components'
import { INTEGRATION_RECORD_STATUS_ENUM } from '@/consts'
import { IntegrationRecordType } from '@/types'

export const IntegrationRecordList: FC<{ records: IntegrationRecordType[] }> = ({ records }) => {
  const { t, i18n } = useTranslation()

  if (!records.length) {
    return <p className="text-secondary mt-2 text-sm">{t('form.integrations.records.empty')}</p>
  }

  return (
    <ul className="divide-accent-light mt-2 max-h-64 divide-y overflow-y-auto text-sm">
      {records.map(record => {
        const succeeded = record.status === INTEGRATION_RECORD_STATUS_ENUM.SUCCEEDED

        return (
          <li key={record.id} className="py-2" data-status={record.status}>
            <div className="flex items-center justify-between gap-x-2">
              <Badge color={succeeded ? 'green' : record.willRetry ? 'amber' : 'red'}>
                {t(
                  succeeded
                    ? 'form.integrations.records.succeeded'
                    : record.willRetry
                      ? 'form.integrations.records.retrying'
                      : 'form.integrations.records.failed'
                )}
              </Badge>
              <span className="text-secondary">{timeFromNow(record.createdAt, i18n.language)}</span>
            </div>

            {record.maxAttempts > 1 && (record.attempt > 1 || !succeeded) && (
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
export default function IntegrationRecords({ formId, appId }: { formId: string; appId: string }) {
  const { t } = useTranslation()
  const { data } = useRequest(() => IntegrationService.records(formId, appId), {
    refreshDeps: [formId, appId]
  })

  return (
    <div className="mt-8">
      <h3 className="text-sm/6 font-medium">{t('form.integrations.records.title')}</h3>
      {data && <IntegrationRecordList records={data} />}
    </div>
  )
}
