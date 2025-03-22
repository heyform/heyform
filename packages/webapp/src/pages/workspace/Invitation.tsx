import { helper } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Async, Avatar, Button, Loader } from '@/components'
import { WorkspaceService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { WorkspaceType } from '@/types'
import { useParam, useRouter } from '@/utils'

export default function WorkspaceInvitation() {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaceId, code } = useParam()
  const { setWorkspaces } = useWorkspaceStore()

  const [workspace, setWorkspace] = useState<WorkspaceType>()

  const { loading, error, run } = useRequest(
    async () => {
      await WorkspaceService.join(workspaceId, code)

      const result = await WorkspaceService.workspaces()

      setWorkspaces(result)
      router.replace(`/workspace/${workspaceId}`)
    },
    {
      refreshDeps: [workspaceId, code],
      manual: true
    }
  )

  const fetch = useCallback(async () => {
    const result = await WorkspaceService.publicDetail(workspaceId, code)

    setWorkspace(result)
    return helper.isValid(result)
  }, [code, setWorkspace, workspaceId])

  return (
    <Async
      fetch={fetch}
      refreshDeps={[workspaceId, code]}
      loader={
        <div className="flex h-full w-full items-center justify-center">
          <Loader className="h-7 w-7" />
        </div>
      }
    >
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold">
          <Trans
            t={t}
            i18nKey="workspace.invitation.headline"
            components={{
              span1: <span className="underline" />,
              span2: <span className="underline" />
            }}
            values={{
              owner: workspace?.owner?.name,
              name: workspace?.name
            }}
          />
        </h1>
        <p className="mt-2 text-sm text-secondary">{t('workspace.invitation.subHeadline')}</p>

        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar
              className=""
              src={workspace?.avatar}
              fallback={workspace?.name}
              resize={{ width: 100, height: 100 }}
            />
            <div className="flex-1 truncate">{workspace?.name}</div>
            <Button className="min-w-20" size="md" loading={loading} onClick={run}>
              {t('workspace.invitation.join')}
            </Button>
          </div>

          {error && !loading && <div className="text-sm/6 text-error">{error.message}</div>}
        </div>
      </div>
    </Async>
  )
}
