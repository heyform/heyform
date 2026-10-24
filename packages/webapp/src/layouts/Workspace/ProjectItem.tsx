import { IconDots, IconTag, IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { ProjectService } from '@/services'
import { cn, useParam } from '@/utils'

import { Button, Dropdown, Tooltip, usePrompt } from '@/components'
import { useAppStore, useWorkspaceStore } from '@/store'
import { ProjectType } from '@/types'

interface ProjectItemProps {
  project: ProjectType
}

const PROJECT_ACTIONS = [
  {
    label: 'components.rename',
    icon: <IconTag className="h-4 w-4" />,
    value: 'rename'
  },
  {
    label: 'components.delete',
    icon: <IconTrash className="h-4 w-4" />,
    value: 'delete'
  }
]

export default function ProjectItem({ project }: ProjectItemProps) {
  const { t } = useTranslation()

  const prompt = usePrompt()
  const { workspaceId } = useParam()
  const { updateProject } = useWorkspaceStore()
  const { openModal } = useAppStore()

  function handleRename() {
    prompt({
      value: project,
      title: t('project.rename.headline'),
      inputProps: {
        name: 'name',
        label: t('project.rename.name.label'),
        rules: [
          {
            required: true,
            message: t('project.rename.name.required')
          }
        ]
      },
      submitProps: {
        className: '!mt-4 px-5 min-w-24',
        size: 'md',
        label: t('components.save')
      },
      fetch: async values => {
        await ProjectService.rename(project.id, values.name)
        updateProject(workspaceId, project.id, values)
      }
    })
  }

  function handleClick(value: string) {
    switch (value) {
      case 'rename':
        return handleRename()

      case 'delete':
        return openModal('DeleteProjectModal', project)
    }
  }

  return (
    <NavLink
      className={({ isActive }) =>
        cn('hf-sidebar-link has-[[data-state=open]]:bg-accent-light group justify-between', {
          'hf-sidebar-link-active': isActive
        })
      }
      to={`/workspace/${workspaceId}/project/${project.id}/`}
    >
      <span className="flex-1 truncate">{project.name}</span>
      <Dropdown
        contentProps={{
          className: 'min-w-36 [&_[data-value=delete]]:text-error',
          side: 'bottom',
          sideOffset: 8,
          align: 'start'
        }}
        options={PROJECT_ACTIONS}
        multiLanguage
        onClick={handleClick}
      >
        <Button.Link
          className="data-[state=open]:bg-accent-light !h-5 !w-5 rounded-md opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
          size="sm"
          iconOnly
        >
          <Tooltip label={t('project.menuTip')}>
            <IconDots className="text-secondary h-4 w-4" />
          </Tooltip>
        </Button.Link>
      </Dropdown>
    </NavLink>
  )
}
