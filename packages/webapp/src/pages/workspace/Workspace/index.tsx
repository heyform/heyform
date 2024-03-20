import { IconCategory, IconDots, IconPencil, IconTrash } from '@tabler/icons-react'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { WorkspaceIcon } from '@/components'
import { Avatar, Button, Dropdown, EmptyStates, Heading, Menus } from '@/components/ui'
import type { ProjectModel, UserModel } from '@/models'
import { DeleteProject } from '@/pages/project/views/DeleteProject'
import { RenameProject } from '@/pages/project/views/RenameProject'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useAsyncEffect, useParam, useVisible } from '@/utils'

import CreateProject from './CreateProject'

interface ItemProps {
  project: ProjectModel
  users: UserModel[]
  isOwner?: boolean
  onRename: (project: ProjectModel) => void
  onDelete: (project: ProjectModel) => void
}

const Item: FC<ItemProps> = ({ project, users, isOwner, onRename, onDelete }) => {
  const { workspaceId } = useParam()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const members = useMemo(() => {
    return users
      .filter(user => project.members.includes(user.id))
      .map(u => ({
        src: u.avatar
      }))
  }, [project.members, users])
  const [visible, setVisible] = useState(false)

  function handleClick() {
    navigate(`/workspace/${workspaceId}/project/${project.id}`)
  }

  function handleMenuClick(name?: IKeyType) {
    switch (name) {
      case 'rename':
        onRename(project)
        break

      case 'delete':
        onDelete(project)
        break
    }
  }

  const Overlay = (
    <Menus onClick={handleMenuClick}>
      <Menus.Item value="rename" label={t('project.rename')} icon={<IconPencil />} />
      {isOwner && <Menus.Item value="delete" label={t('project.del')} icon={<IconTrash />} />}
    </Menus>
  )

  return (
    <li
      className="group col-span-1 cursor-pointer rounded-md border border-gray-200 bg-white hover:bg-slate-50"
      onClick={handleClick}
    >
      <div className="p-6">
        <h3 className="truncate text-base font-medium text-slate-900">{project.name}</h3>
        <p className="mt-1 truncate text-sm text-slate-500">
          {project.formCount > 0
            ? `${project.formCount} ${t('workspace.workSpace.forms')}`
            : t('workspace.workSpace.noForms')}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <Avatar.Group
            avatarClassName="w-10 h-10"
            options={members}
            size={80}
            maximum={8}
            circular
            rounded
          />
          <Dropdown
            className={clsx('rounded-md p-1 opacity-0 hover:bg-slate-100 group-hover:opacity-100', {
              'opacity-100': visible
            })}
            overlay={Overlay}
            onDropdownVisibleChange={setVisible}
          >
            <IconDots className="h-5 w-5 text-slate-400 hover:text-slate-900" />
          </Dropdown>
        </div>
      </div>
    </li>
  )
}

const Workspace = observer(() => {
  const { t } = useTranslation()
  const { workspaceId } = useParam()
  const workspaceStore = useStore('workspaceStore')

  const [project, setProject] = useState<ProjectModel | null>(null)
  const [createProjectVisible, openCreateProject, closeCreateProject] = useVisible()
  const [deleteProjectVisible, openDeleteProject, closeDeleteProject] = useVisible()
  const [renameProjectVisible, openRenameProject, closeRenameProject] = useVisible()

  function handleDelete(proj: ProjectModel) {
    setProject(proj)
    openDeleteProject()
  }

  function handleRename(proj: ProjectModel) {
    setProject(proj)
    openRenameProject()
  }

  useAsyncEffect(async () => {
    const result = await WorkspaceService.members(workspaceId)
    workspaceStore.setMembers(workspaceId, result)
  }, [workspaceId])

  return (
    <div>
      <Heading
        title={workspaceStore.workspace?.name}
        icon={
          <Avatar
            className="h-14 w-14"
            src={workspaceStore.workspace?.avatar}
            defaultIcon={<WorkspaceIcon />}
            size={80}
            rounded
            circular
          />
        }
        description={`${workspaceStore.workspace?.memberCount} ${t('workspace.join.member')}`}
        actions={
          workspaceStore.workspace?.projects.length > 0 && (
            <Button type="primary" onClick={openCreateProject}>
              {t('workspace.workSpace.createP2')}
            </Button>
          )
        }
      />

      <div className="py-4">
        {workspaceStore.workspace?.projects.length > 0 ? (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceStore.workspace?.projects.map(proj => (
              <Item
                key={proj.id}
                project={proj}
                users={workspaceStore.members}
                isOwner={workspaceStore.workspace?.isOwner}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        ) : (
          <EmptyStates
            className="empty-states-fit mt-8"
            icon={<IconCategory className="non-scaling-stroke" />}
            title={t('workspace.workSpace.noProject')}
            description={t('workspace.workSpace.text')}
            action={
              <Button onClick={openCreateProject}>{t('workspace.workSpace.createP2')}</Button>
            }
          />
        )}
      </div>

      {/* Create project */}
      <CreateProject visible={createProjectVisible} onClose={closeCreateProject} />

      {/* Delete project */}
      <DeleteProject
        visible={deleteProjectVisible}
        project={project}
        onClose={closeDeleteProject}
        onComplete={closeDeleteProject}
      />

      {/* Rename project */}
      <RenameProject
        visible={renameProjectVisible}
        project={project}
        onClose={closeRenameProject}
      />
    </div>
  )
})

export default Workspace
