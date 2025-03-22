import { LayoutProps } from '@heyooo-inc/react-router'
import { FC, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'

import { Button } from '@/components'
import { useAppStore, useWorkspaceStore } from '@/store'
import { cn, useParam } from '@/utils'

import { WorkspaceLayout } from '../Workspace'
import ProjectMembers from './ProjectMembers'
import ProjectMembersModal from './ProjectMembersModal'

export const ProjectLayout: FC<LayoutProps> = ({ options, children }) => {
  const { t } = useTranslation()

  const location = useLocation()
  const { workspaceId, projectId } = useParam()
  const { openModal } = useAppStore()
  const { project } = useWorkspaceStore()

  const navigations = useMemo(
    () => [
      {
        value: 'analytics',
        label: t('project.forms.title'),
        to: `/workspace/${workspaceId}/project/${projectId}/`
      },
      {
        value: 'trash',
        label: t('project.trash.title'),
        to: `/workspace/${workspaceId}/project/${projectId}/trash`
      }
    ],
    [projectId, workspaceId, t]
  )

  useEffect(() => {
    if (location.state?.isCreateModalOpen) {
      window.history.replaceState({}, '')
      openModal('CreateFormModal')
    }
  }, [location.state?.isCreateModalOpen])

  useEffect(() => {
    return () => {
      window.history.replaceState({}, '')
    }
  }, [])

  return (
    <>
      <WorkspaceLayout options={options}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl/8 font-semibold sm:text-xl/8">{project?.name}</h1>

          <Button size="md" onClick={() => openModal('CreateFormModal')}>
            {t('form.creation.title')}
          </Button>
        </div>

        <ProjectMembers />

        {/* Navigation */}
        <div className="mt-5 border-b border-accent-light">
          <nav className="flex items-center gap-6 text-sm font-medium text-secondary">
            {navigations.map(n => (
              <NavLink
                key={n.value}
                className={({ isActive }) =>
                  cn('py-3 hover:text-primary', {
                    'relative text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary':
                      isActive
                  })
                }
                to={n.to}
                end
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {children}
      </WorkspaceLayout>

      <ProjectMembersModal />
    </>
  )
}
