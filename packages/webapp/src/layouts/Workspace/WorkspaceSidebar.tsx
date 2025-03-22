import { helper } from '@heyform-inc/utils'
import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  IconCreditCard,
  IconHelp,
  IconHome,
  IconLocation,
  IconPlus,
  IconSearch,
  IconSettings,
  IconStack2,
  IconUsers
} from '@tabler/icons-react'
import { FC, ForwardRefExoticComponent } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { Button, PlanUpgrade, Tooltip } from '@/components'
import { HELP_CENTER_URL, PlanGradeEnum, TEMPLATES_URL } from '@/consts'
import { useAppStore, useModal, useWorkspaceStore } from '@/store'
import { cn, useParam } from '@/utils'

import ChangelogButton from './ChangelogButton'
import ProjectItem from './ProjectItem'
import WorkspaceAccount from './WorkspaceAccount'
import WorkspaceSwitcher from './WorkspaceSwitcher'

interface LinkProps {
  to: string
  icon: ForwardRefExoticComponent<Any>
  label: string
}

const RESOURCE_LINKS = [
  {
    icon: IconLocation,
    title: 'workspace.sidebar.gettingStarted',
    href: `${HELP_CENTER_URL}/quickstart`
  },
  {
    icon: IconHelp,
    title: 'workspace.sidebar.help',
    href: HELP_CENTER_URL
  },
  {
    icon: IconStack2,
    title: 'workspace.sidebar.template',
    href: TEMPLATES_URL
  }
]

const Link: FC<LinkProps> = ({ to, icon: Icon, label }) => {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-primary/5 sm:px-2 sm:py-1.5 lg:py-2',
          {
            'relative before:absolute before:inset-y-2 before:-left-4 before:w-0.5 before:rounded-full before:bg-primary [&_[data-slot=icon]]:stroke-primary':
              isActive
          }
        )
      }
      to={to}
      end
    >
      <Icon className="h-5 w-5 stroke-secondary group-hover:stroke-primary" data-slot="icon" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

const WorkspaceSidebarComponent = () => {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { openModal } = useAppStore()
  const { workspace } = useWorkspaceStore()

  return (
    <div className="flex h-full flex-col max-lg:rounded-lg max-lg:bg-foreground">
      <div className="border-b border-accent-light p-4">
        <WorkspaceSwitcher />
      </div>

      <div className="scrollbar flex flex-1 flex-col p-4">
        <nav className="flex flex-col gap-y-0.5">
          {/* Home */}
          <Link to={`/workspace/${workspaceId}/`} icon={IconHome} label={t('dashboard.title')} />

          {/* Search */}
          <button
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-primary/5 sm:px-2 sm:py-1.5 lg:py-2"
            onClick={() => openModal('SearchModal')}
          >
            <IconSearch
              className="h-5 w-5 stroke-secondary group-hover:stroke-primary"
              data-slot="icon"
            />
            <span className="truncate">{t('workspace.sidebar.search')}</span>
          </button>

          {/* Members */}
          <PlanUpgrade
            minimalGrade={PlanGradeEnum.PREMIUM}
            isUpgradeShow={false}
            fallback={openUpgradeModal => (
              <button
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-primary/5 sm:px-2 sm:py-1.5 lg:py-2"
                onClick={openUpgradeModal}
              >
                <IconUsers
                  className="h-5 w-5 stroke-secondary group-hover:stroke-primary"
                  data-slot="icon"
                />
                <span className="truncate">{t('members.title')}</span>
              </button>
            )}
          >
            <Link
              to={`/workspace/${workspaceId}/members`}
              icon={IconUsers}
              label={t('members.title')}
            />
          </PlanUpgrade>

          {workspace.isOwner && (
            <>
              {/* Billing */}
              <Link
                to={`/workspace/${workspaceId}/billing`}
                icon={IconCreditCard}
                label={t('billing.title')}
              />

              {/* Settings */}
              <Link
                to={`/workspace/${workspaceId}/settings`}
                icon={IconSettings}
                label={t('settings.title')}
              />
            </>
          )}
        </nav>

        <div className="group/projects mt-8 flex flex-col gap-0.5">
          <div className="mb-1 flex items-center justify-between px-2 text-xs/6 font-medium text-secondary">
            <h3>{t('workspace.sidebar.projects')}</h3>
            <Tooltip label={t('project.creation.title')}>
              <Button.Link
                className={cn(
                  '-mr-1 !h-6 !w-6 rounded text-secondary opacity-0 group-hover/projects:opacity-100',
                  {
                    'opacity-100': helper.isEmpty(workspace?.projects)
                  }
                )}
                size="sm"
                iconOnly
                onClick={() => openModal('CreateProjectModal')}
              >
                <IconPlus className="h-5 w-5" />
              </Button.Link>
            </Tooltip>
          </div>

          {helper.isValidArray(workspace?.projects) ? (
            <nav>
              {workspace!.projects.map(p => (
                <ProjectItem key={p.id} project={p} />
              ))}
            </nav>
          ) : (
            <div className="px-3 sm:px-2">
              <div className="rounded-lg border border-dashed border-accent-light p-2 text-xs text-secondary shadow-sm">
                {t('workspace.sidebar.noProjects')}
              </div>
            </div>
          )}
        </div>

        <div aria-hidden="true" className="mt-8 flex-1"></div>

        <nav className="mt-8">
          {RESOURCE_LINKS.map(row => (
            <a
              key={row.title}
              href={row.href}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium hover:bg-accent-light sm:px-1.5 sm:py-1.5 lg:py-2"
            >
              <row.icon className="h-5 w-5 stroke-secondary group-hover:stroke-primary" />
              <span className="truncate">{t(row.title)}</span>
            </a>
          ))}

          {/* Changelog */}
          <ChangelogButton />
        </nav>
      </div>

      <WorkspaceAccount containerClassName="max-lg:hidden" />
    </div>
  )
}

export const WorkspaceSidebarModal = () => {
  const { isOpen, onOpenChange } = useModal('WorkspaceSidebarModal')

  return (
    <Root open={isOpen} onOpenChange={onOpenChange}>
      <Portal>
        <Overlay className="fixed inset-0 z-10 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Content className="fixed bottom-2 left-2 top-2 z-10 w-72 rounded-lg border border-accent-light bg-foreground shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-left-[80%]">
          <Title>
            <VisuallyHidden />
          </Title>
          <Description>
            <VisuallyHidden />
          </Description>
          <WorkspaceSidebarComponent />
        </Content>
      </Portal>
    </Root>
  )
}

const WorkspaceSidebar = () => {
  return (
    <div
      className="fixed inset-y-0 left-0 w-64 transition-transform duration-300 max-lg:hidden"
      data-slot="layout-sidebar"
    >
      <WorkspaceSidebarComponent />
    </div>
  )
}

export default WorkspaceSidebar
