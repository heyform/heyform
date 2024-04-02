import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { LogoIcon, WorkspaceIcon } from '@/components'
import { Avatar, Button } from '@/components/ui'
import type { WorkspaceModel } from '@/models'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

const JoinWorkspace = () => {
  const navigate = useNavigate()
  const workspaceStore = useStore('workspaceStore')
  const { workspaceId, inviteCode } = useParam()
  const [workspace, setWorkspace] = useState<WorkspaceModel | null>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { t } = useTranslation()

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      await WorkspaceService.join(workspaceId, inviteCode)

      // Reload workspaces
      const result = await WorkspaceService.workspaces()
      workspaceStore.setWorkspaces(result)

      navigate(`/workspace/${workspaceId}`, {
        replace: true
      })
    } catch (err: any) {
      setLoading(false)
      setError(err)
    }
  }

  async function fetchWorkspaceDetail() {
    setLoading(true)
    setError(null)

    try {
      const result = await WorkspaceService.publicDetail(workspaceId, inviteCode)
      setWorkspace(result)
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchWorkspaceDetail()
  }, [workspaceId])

  return (
    <div>
      <div>
        <LogoIcon className="h-8 w-auto" />
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
          {t('workspace.join.invited')} {workspace?.owner?.name}
          {t('workspace.join.UsernameAdd')}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t('workspace.join.joinText')}</p>
      </div>

      <div className="mt-8">
        <div className="mt-6">
          <div className="group flex items-center rounded-md py-2.5 text-sm text-slate-700">
            <Avatar
              className="!h-12 !w-12"
              src={workspace?.avatar}
              size={80}
              defaultIcon={<WorkspaceIcon />}
              rounded
              circular
            />

            <div className="ml-4 flex-auto">
              <p className="truncate text-sm font-medium text-slate-700">{workspace?.name}</p>
              <p className="truncate text-sm text-slate-500">
                {workspace?.memberCount} {t('workspace.join.member')}
              </p>
            </div>

            <Button
              className="px-2.5 py-0.5"
              type="primary"
              rounded
              loading={loading}
              onClick={handleClick}
            >
              {t('workspace.join.bottom')}
            </Button>
          </div>

          {error && <p className="text-xs text-red-500">{error.message}</p>}
        </div>
      </div>
    </div>
  )
}

export default observer(JoinWorkspace)
