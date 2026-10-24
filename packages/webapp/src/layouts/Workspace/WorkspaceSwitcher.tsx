import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { IconCheck, IconChevronDown, IconPlus } from '@tabler/icons-react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { useRouter } from '@/utils'

import { Avatar, Button } from '@/components'
import { useAppStore, useWorkspaceStore } from '@/store'
import { WorkspaceType } from '@/types'

interface WorkspaceItemProps {
  workspace: WorkspaceType
  isActive: boolean
  onClick: (workspaceId: string) => void
}

const WorkspaceItem: FC<WorkspaceItemProps> = ({ workspace, isActive, onClick }) => {
  function handleClick() {
    onClick(workspace.id)
  }

  return (
    <DropdownMenu.Item
      key={workspace.id}
      className="text-primary data-[highlighted]:bg-accent-light flex cursor-pointer items-center gap-x-2 rounded-lg px-3 py-2.5 text-base/6 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 sm:px-2 sm:py-1.5 sm:text-sm/6"
      onClick={handleClick}
    >
      <div className="flex max-w-[calc(100%-1rem)] flex-1 items-center gap-x-2.5">
        <Avatar
          className="h-6 w-6"
          src={workspace.avatar}
          fallback={workspace.name}
          resize={{ width: 100, height: 100 }}
        />
        <div className="max-w-[calc(100%-2rem)] truncate font-medium">{workspace.name}</div>
      </div>

      {isActive && <IconCheck className="text-secondary h-[1.125rem] w-[1.125rem]" />}
    </DropdownMenu.Item>
  )
}

export default function WorkspaceSwitcher() {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaces, workspace } = useWorkspaceStore()
  const { openModal } = useAppStore()

  function handleClick(newWorkspaceId: string) {
    router.push(`/workspace/${newWorkspaceId}/`)
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button.Link className="data-[state=open]:bg-accent-light w-full rounded-lg px-3 py-2.5 sm:px-2 sm:py-1.5 [&_[data-slot=button]]:justify-between">
          <div className="flex max-w-[calc(100%-1.25rem)] flex-1 items-center gap-x-2">
            <Avatar
              className="h-6 w-6"
              src={workspace?.avatar}
              fallback={workspace?.name}
              resize={{ width: 100, height: 100 }}
            />
            <div className="max-w-[calc(100%-2rem)] truncate font-medium">{workspace?.name}</div>
          </div>
          <IconChevronDown className="text-secondary h-[1.125rem] w-[1.125rem]" />
        </Button.Link>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-foreground ring-accent-light animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 isolate z-10 min-w-80 origin-top-left rounded-xl p-1 shadow-lg outline outline-1 outline-transparent ring-1 duration-100 focus:outline-none lg:min-w-64"
          align="start"
          sideOffset={8}
        >
          <div className="text-secondary mx-2 mt-2 text-xs/6 font-medium sm:mx-2">
            {t('workspace.sidebar.workspaces')}
          </div>
          <div className="space-y-1">
            {workspaces.map(w => (
              <WorkspaceItem
                key={w.id}
                workspace={w}
                isActive={w.id === workspace?.id}
                onClick={handleClick}
              />
            ))}
          </div>

          <DropdownMenu.Separator className="bg-accent-light mx-2 mb-1 mt-2 h-px sm:mx-2" />

          <DropdownMenu.Item onClick={() => openModal('CreateWorkspaceModal')}>
            <Button.Link className="w-full [&_[data-slot=button]]:justify-start">
              <IconPlus className="h-[1.125rem] w-[1.125rem]" />
              <span>{t('workspace.creation.title')}</span>
            </Button.Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
