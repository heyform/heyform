import { formatBytes } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components'
import { WorkspaceService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { formatDay, useParam } from '@/utils'

export default function Overview() {
  const { t, i18n } = useTranslation()

  const { workspaceId } = useParam()
  const { workspace } = useWorkspaceStore()

  const { data, loading } = useRequest(
    async () => {
      return WorkspaceService.subscription(workspaceId)
    },
    {
      refreshDeps: [workspaceId]
    }
  )

  return (
    <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
      {/* Forms */}
      <div>
        <div className="text-base/6 font-medium sm:text-sm/6">{t('dashboard.forms')}</div>
        <Skeleton
          className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-2/5 [&_[data-slot=skeleton]]:sm:h-6"
          loading={loading || !data}
        >
          <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">{data?.formCount}/∞</div>
        </Skeleton>
      </div>

      {/* Submissions */}
      <div>
        <div className="text-base/6 font-medium sm:text-sm/6">{t('dashboard.submission')}</div>
        <Skeleton
          className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-2/5 [&_[data-slot=skeleton]]:sm:h-6"
          loading={loading || !data}
        >
          <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
            {data?.submissionQuota}/{workspace?.plan.submissionLimit}
          </div>
        </Skeleton>
        <div className="mt-1 text-sm/6 text-secondary sm:text-xs/6">
          {t('dashboard.resetsOn', {
            date: formatDay(dayjs().add(1, 'month').startOf('month'), i18n.language)
          })}
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="text-base/6 font-medium sm:text-sm/6">{t('dashboard.members')}</div>
        <Skeleton
          className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-2/5 [&_[data-slot=skeleton]]:sm:h-6"
          loading={loading || !data}
        >
          <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
            {data?.memberCount}/{workspace?.plan.memberLimit || 1}
          </div>
        </Skeleton>
      </div>

      {/* Storage */}
      <div>
        <div className="text-base/6 font-medium sm:text-sm/6">{t('dashboard.storage')}</div>
        <Skeleton
          className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-2/5 [&_[data-slot=skeleton]]:sm:h-6"
          loading={loading || !data}
        >
          <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
            {formatBytes(data?.storageQuota)}/{workspace?.plan.storageLimit}
          </div>
        </Skeleton>
      </div>
    </div>
  )
}
