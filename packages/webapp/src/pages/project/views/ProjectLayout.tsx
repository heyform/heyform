import { IconChevronDown, IconDots, IconPencil, IconTrash } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'

import { Avatar, Button, Dropdown, Heading, Menus, Navbar } from '@/components/ui'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useAsyncEffect, useParam, useVisible } from '@/utils'

import { DeleteProject } from './DeleteProject'
import { ProjectMembers } from './ProjectMembers'
import { RenameProject } from './RenameProject'
import './index.scss'

interface HeaderProps {
  onRename: () => void
  onDelete: () => void
  onMemberManage: () => void
}

const Header: FC<HeaderProps> = observer(({ onRename, onDelete, onMemberManage }) => {
  const { workspaceId } = useParam()
  const workspaceStore = useStore('workspaceStore')
  const appStore = useStore('appStore')
  const { t } = useTranslation()

  const members = useMemo(() => {
    return workspaceStore.members
      .filter(m => workspaceStore.project?.members.includes(m.id))
      .map(m => ({
        src: m.avatar
      }))
  }, [workspaceStore.project?.members, workspaceStore.members])

  function handleMenuClick(name?: IKeyType) {
    switch (name) {
      case 'rename':
        return onRename()

      case 'delete':
        return onDelete()
    }
  }

  function handleCreateForm() {
    appStore.isCreateFormOpen = true
  }

  useAsyncEffect(async () => {
    const result = await WorkspaceService.members(workspaceId)
    workspaceStore.setMembers(workspaceId, result)
  }, [workspaceId])

  return (
    <Heading
      title={
        <div className="flex items-center">
          <span>{workspaceStore.project?.name}</span>
          <Dropdown
            className="ml-1 cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            placement="bottom-start"
            overlay={
              <Menus onClick={handleMenuClick}>
                <Menus.Item value="rename" icon={<IconPencil />} label={t('project.rename')} />
                {workspaceStore.workspace?.isOwner && (
                  <Menus.Item value="delete" icon={<IconTrash />} label={t('project.del')} />
                )}
              </Menus>
            }
          >
            <IconChevronDown className="h-5 w-5" />
          </Dropdown>
        </div>
      }
      description={
        <div className="mt-2 flex items-center">
          <Avatar.Group
            avatarClassName="w-10 h-10"
            options={members}
            size={80}
            maximum={8}
            circular
            rounded
          />
          <Button
            className="ml-2 h-8 w-8 p-1.5"
            leading={<IconDots />}
            rounded
            onClick={onMemberManage}
          />
        </div>
      }
      actions={
        <Button type="primary" onClick={handleCreateForm}>
          {t('project.create2')}
        </Button>
      }
    />
  )
})

export const ProjectLayout: FC<IComponentProps> = ({ children }) => {
  const navigate = useNavigate()
  const { workspaceId, projectId } = useParam()
  const workspaceStore = useStore('workspaceStore')

  const [renameProjectVisible, openRenameProject, closeRenameProject] = useVisible()
  const [deleteProjectVisible, openDeleteProject, closeDeleteProject] = useVisible()
  const [projectMembersVisible, openProjectMembers, closeProjectMembers] = useVisible()
  const { t } = useTranslation()

  function handleDeleteProjectComplete() {
    navigate(`/workspace/${workspaceId}`, {
      replace: true
    })
  }

  return (
    <div>
      <Header
        onRename={openRenameProject}
        onDelete={openDeleteProject}
        onMemberManage={openProjectMembers}
      />

      <div className="py-4">
        <Navbar className="mt-4">
          <NavLink to={`/workspace/${workspaceId}/project/${projectId}`} end={true}>
            {t('project.forms')}
          </NavLink>
          <NavLink to={`/workspace/${workspaceId}/project/${projectId}/trash`}>
            {t('project.Trash')}
          </NavLink>
        </Navbar>

        {children}
      </div>

      {/* Manage project */}
      <ProjectMembers visible={projectMembersVisible} onClose={closeProjectMembers} />

      {/* Rename project */}
      <RenameProject
        visible={renameProjectVisible}
        project={workspaceStore.project}
        onClose={closeRenameProject}
      />

      {/* Delete project */}
      <DeleteProject
        visible={deleteProjectVisible}
        project={workspaceStore.project}
        onClose={closeDeleteProject}
        onComplete={handleDeleteProjectComplete}
      />
    </div>
  )
}
