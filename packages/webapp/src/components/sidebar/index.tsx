import { IconX } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { CSSTransition } from 'react-transition-group'
import { useTranslation } from 'react-i18next'

import { useStore } from '@/store'

import { Navigation } from './Navigation'
import { UserAccount } from './UserAccount'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import './index.scss'

interface SidebarProps {
  onCreateWorkspace: () => void
  onWorkspaceSettingsOpen: () => void
}

export const Sidebar: FC<SidebarProps> = observer(
  ({ onCreateWorkspace, onWorkspaceSettingsOpen }) => {
    const appStore = useStore('appStore')
		const { t } = useTranslation()

    function handleClose() {
      appStore.isSidebarOpen = false
    }

    function handleCreateWorkspace() {
      handleClose()
      onCreateWorkspace()
    }

    function handleOpenWorkspaceSettings() {
      handleClose()
      onWorkspaceSettingsOpen()
    }

    return (
      <>
        <CSSTransition
          in={appStore.isSidebarOpen}
          timeout={0}
          mountOnEnter={true}
          classNames="sidebar-popup"
          unmountOnExit={false}
          onExited={handleClose}
        >
          <div className="sidebar fixed inset-0 z-10 flex md:hidden">
            <div
              className="sidebar-overlay fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity duration-300 ease-in-out"
              aria-hidden="true"
            />
            <div className="sidebar-wrapper relative flex h-full w-full max-w-xs flex-1 transform-gpu flex-col bg-white transition-transform duration-300 ease-in-out">
              <div className="flex h-0 flex-1 flex-col pt-5">
                <WorkspaceSwitcher onCreateWorkspace={handleCreateWorkspace} />
                <Navigation isMobile={true} onWorkspaceSettingsOpen={handleOpenWorkspaceSettings} />
              </div>

              <UserAccount />

              <div className="absolute right-0 top-0 -mr-12 pt-2 md:hidden">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={handleClose}
                >
                  <span className="sr-only">{t('other.closeSidebar')}</span>
                  <IconX className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </CSSTransition>

        {/* Sidebar for desktop */}
        <div className="sidebar fixed inset-0 hidden md:flex md:flex-shrink-0">
          <div className="relative flex h-full w-64 flex-1 flex-col bg-slate-100">
            <div className="flex h-0 flex-1 flex-col pt-5">
              <WorkspaceSwitcher onCreateWorkspace={onCreateWorkspace} />
              <Navigation onWorkspaceSettingsOpen={onWorkspaceSettingsOpen} />
            </div>
            <UserAccount />
          </div>
        </div>
      </>
    )
  }
)
