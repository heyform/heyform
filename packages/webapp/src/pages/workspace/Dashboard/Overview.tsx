import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { WorkspaceService } from '@/services'
import { useParam } from '@/utils'
import { formatBytes } from '@heyform-inc/utils'

import { Skeleton } from '@/components'

export default function Overview() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()

  const { data, loading } = useRequest(
    async () => {
      return WorkspaceService.overview(workspaceId)
    },
    {
      refreshDeps: [workspaceId]
    }
  )

  return (
    <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
      {/* Forms */}
      <div>
        <div className="text-base/6 font-medium sm:text-sm/6">{t('dashboard.forms')}</div>
        <Skeleton
          className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-2/5 [&_[data-slot=skeleton]]:sm:h-6"
          loading={loading || !data}
        >
          <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">{data?.formCount}</div>
        </Skeleton>
      </div>

      {/* Submissions */}
      <div>
        <div className="text-base/6 font-medium sm:text-sm/6">{t('dashboard.submission')}</div>
        <Skeleton
          className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-2/5 [&_[data-slot=skeleton]]:sm:h-6"
          loading={loading || !data}
        >
          <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">{data?.submissionQuota}</div>
        </Skeleton>
      </div>

      {/* Members */}
      <div>
        <div className="text-base/6 font-medium sm:text-sm/6">{t('dashboard.members')}</div>
        <Skeleton
          className="mt-3 h-8 [&_[data-slot=skeleton]]:h-[1.875rem] [&_[data-slot=skeleton]]:w-2/5 [&_[data-slot=skeleton]]:sm:h-6"
          loading={loading || !data}
        >
          <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">
            {data?.memberCount || 1}
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
            {formatBytes(data?.storageQuota)}
          </div>
        </Skeleton>
      </div>
    </div>
  )
}
