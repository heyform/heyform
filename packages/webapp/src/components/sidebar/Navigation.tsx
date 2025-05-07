import {
  IconCreditCard,
  IconFileStack,
  IconGift,
  IconHelp,
  IconHome,
  IconPlayerPlay,
  IconSettings,
  IconUsers
} from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import type { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, NavLinkProps } from 'react-router-dom'

import { useStore } from '@/store'
import { useParam } from '@/utils'

interface NavigationProps {
  isMobile?: boolean
  onWorkspaceSettingsOpen: () => void
}

interface CustomLinkProps extends Omit<NavLinkProps, 'children'> {
  isMobile?: boolean
  children: ReactNode
  onClick: () => void
}

const CustomLink: FC<CustomLinkProps> = ({ isMobile, onClick, children, ...restProps }) => {
  if (isMobile) {
    return (
      <div {...(restProps as any)} onClick={onClick}>
        {children}
      </div>
    )
  }

  return <NavLink {...restProps}>{children}</NavLink>
}

export const Navigation: FC<NavigationProps> = observer(
  ({ isMobile = false, onWorkspaceSettingsOpen }) => {
    const { workspaceId } = useParam()
    const workspaceStore = useStore('workspaceStore')
    const appStore = useStore('appStore')
    const { t } = useTranslation()

    function handleCloseSidebar() {
      appStore.isSidebarOpen = false
    }

    return (
      <nav className="sidebar-nav scrollbar mt-5 flex-1 px-2 pb-4">
        <div className="space-y-1">
          <CustomLink
            isMobile={isMobile}
            to={`/workspace/${workspaceId}`}
            end={true}
            className="group flex items-center rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-900"
            onClick={handleCloseSidebar}
          >
            <IconHome className="mr-3 h-5 w-5 flex-shrink-0 text-slate-700" />
            {t('other.labelList.Dashboard')}
          </CustomLink>
          <CustomLink
            isMobile={isMobile}
            to={`/workspace/${workspaceId}/member`}
            className="group flex items-center rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-900"
            onClick={handleCloseSidebar}
          >
            <IconUsers className="mr-3 h-5 w-5 flex-shrink-0 text-slate-700" />
            {t('other.labelList.TeamMembers')}
          </CustomLink>
          {workspaceStore.workspace?.isOwner && (
            <div
              className="group flex cursor-pointer items-center rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              onClick={onWorkspaceSettingsOpen}
            >
              <IconSettings className="mr-3 h-5 w-5 flex-shrink-0 text-slate-700" />
              {t('other.labelList.Workspace')}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="mt-8">
          <h3
            className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-900"
            id="projects-headline"
          >
            {t('other.labelList.Projects')}
          </h3>
          <div className="mt-1 space-y-1" aria-labelledby="projects-headline">
            {workspaceStore.workspace?.projects.map(project => (
              <CustomLink
                key={project.id}
                isMobile={isMobile}
                to={`/workspace/${workspaceId}/project/${project.id}`}
                className="group flex items-center rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                onClick={handleCloseSidebar}
              >
                {project.name}
              </CustomLink>
            ))}
          </div>
        </div>

        {/* Resources links */}
        <div className="mt-8">
          <h3
            className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-900"
            id="resources-headline"
          >
            {t('other.labelList.Resources')}
          </h3>
          <div className="mt-1 space-y-1" aria-labelledby="resources-headline">
            <a
              href="https://docs.heyform.net/quickstart/create-a-form"
              target="_blank"
              className="group flex items-center rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-900"
            >
              <IconPlayerPlay className="mr-3 h-5 w-5 flex-shrink-0 text-slate-700" />
              <span className="truncate">{t('other.labelList.GettingStarted')}</span>
            </a>
            <a
              href="https://docs.heyform.net"
              target="_blank"
              className="group flex items-center rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-900"
            >
              <IconHelp className="mr-3 h-5 w-5 flex-shrink-0 text-slate-700" />
              <span className="truncate">{t('other.labelList.Help')}</span>
            </a>
            <a
              href="https://docs.heyform.net/changelog"
              target="_blank"
              className="group flex items-center rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-900"
            >
              <IconGift className="mr-3 h-5 w-5 flex-shrink-0 text-slate-700" />
              <span className="truncate">{t('other.labelList.Changelog')}</span>
            </a>
          </div>
        </div>
      </nav>
    )
  }
)
