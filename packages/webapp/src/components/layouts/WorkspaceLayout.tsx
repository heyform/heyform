import { IconMenu2 } from '@tabler/icons-react'
import type { FC } from 'react'

import CreateWorkspaceModal from '@/pages/form/views/CreateWorkspaceModal'
import WorkspaceSettings from '@/pages/workspace/WorkspaceSettings'
import { useStore } from '@/store'
import { useVisible } from '@/utils'

import { Sidebar } from '../sidebar'
import { WorkspaceGuard } from './WorkspaceGuard'
import './index.scss'

export const WorkspaceLayout: FC<IComponentProps> = ({ children }) => {
  const appStore = useStore('appStore')

  const [workspaceSettingsVisible, openWorkspaceSettings, closeWorkspaceSettings] = useVisible()
  const [createWorkspaceVisible, openCreateWorkspace, closeCreateWorkspace] = useVisible()

  function handleSidebarOpen() {
    appStore.isSidebarOpen = true
  }

  return (
    <WorkspaceGuard>
      <div className="min-h-screen w-full bg-white">
        <Sidebar
          onWorkspaceSettingsOpen={openWorkspaceSettings}
          onCreateWorkspace={openCreateWorkspace}
        />

        <div className="workspace-container">
          <div className="pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
            <button
              className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={handleSidebarOpen}
            >
              <span className="sr-only">Open sidebar</span>
              <IconMenu2 className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <main className="relative z-0 focus:outline-none">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8">{children}</div>
            </div>
          </main>
        </div>
      </div>

      {/* Workspace settings modal */}
      <WorkspaceSettings visible={workspaceSettingsVisible} onClose={closeWorkspaceSettings} />

      {/* Create workspace modal */}
      <CreateWorkspaceModal visible={createWorkspaceVisible} onClose={closeCreateWorkspace} />
    </WorkspaceGuard>
  )
}
