import type { FC } from 'react'
import { useEffect } from 'react'

import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useAsyncEffect, useParam } from '@/utils'

import { AuthGuard } from './AuthGuard'

export const WorkspaceGuard: FC<IComponentProps> = ({ children }) => {
  const workspaceStore = useStore('workspaceStore')
  const { workspaceId, projectId } = useParam()

  useAsyncEffect(async () => {
    const result = await WorkspaceService.workspaces()
    workspaceStore.setWorkspaces(result)
  }, [])

  useEffect(() => {
    workspaceStore.selectWorkspace(workspaceId)

    if (workspaceId) {
      document.title = `${workspaceStore.workspace?.name} - HeyForm`
    }
  }, [workspaceId])

  useEffect(() => {
    workspaceStore.selectProject(projectId)

    if (projectId) {
      document.title = `${workspaceStore.project?.name} · ${workspaceStore.workspace?.name} - HeyForm`
    }
  }, [projectId])

  return <AuthGuard>{children}</AuthGuard>
}
