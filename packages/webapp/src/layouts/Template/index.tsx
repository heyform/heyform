import { LayoutProps } from '@heyooo-inc/react-router'
import { useAsyncEffect } from 'ahooks'
import { FC, useState } from 'react'

import { LoginGuard } from '@/layouts'
import { WorkspaceService } from '@/services'
import { useWorkspaceStore } from '@/store'

import CreateProjectModal from '../Workspace/CreateProjectModal'
import CreateWorkspaceModal from '../Workspace/CreateWorkspaceModal'

export const TemplateLayout: FC<LayoutProps> = ({ options, children }) => {
  const { setWorkspaces } = useWorkspaceStore()
  const [isMounted, setMounted] = useState(false)

  useAsyncEffect(async () => {
    setWorkspaces(await WorkspaceService.workspaces())
    setMounted(true)
  }, [])

  return (
    <LoginGuard options={options}>
      {isMounted && children}
      <CreateWorkspaceModal />
      <CreateProjectModal />
    </LoginGuard>
  )
}
