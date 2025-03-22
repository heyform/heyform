import { helper, toJSON } from '@heyform-inc/utils'
import {
  IconArrowLeft,
  IconFolder,
  IconHelp,
  IconPlus,
  IconSearch,
  IconSquareRotated,
  IconStack2
} from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { Command } from 'cmdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Loader, Modal } from '@/components'
import { HELP_CENTER_URL, TEMPLATES_URL } from '@/consts'
import { WorkspaceService } from '@/services'
import { useAppStore, useModal, useWorkspaceStore } from '@/store'
import { cn, useParam, useRouter } from '@/utils'

interface GroupType {
  type: 'action' | 'navigation' | 'form' | 'document'
  heading: string
  items: AnyMap[]
}

const ProjectsPage = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaceId } = useParam()
  const { openModal, closeModal } = useAppStore()
  const { workspace } = useWorkspaceStore()

  const handleCreateForm = useCallback(
    (projectId: string) => {
      closeModal('SearchModal')
      router.push(`/workspace/${workspaceId}/project/${projectId}/`, {
        state: {
          isCreateModalOpen: true
        }
      })
    },
    [workspaceId]
  )

  function handleCreateProject() {
    closeModal('SearchModal')
    openModal('CreateProjectModal')
  }

  if (helper.isValidArray(workspace?.projects)) {
    return (
      <Command.Group
        className="select-none text-sm/6 text-secondary [&_[cmdk-group-heading]]:mb-0 [&_[cmdk-group-heading]]:px-4"
        heading={t('dashboard.search.selectProject')}
      >
        {workspace!.projects.map(p => (
          <Command.Item
            key={p.id}
            className="mx-2 cursor-pointer rounded-lg aria-selected:bg-accent"
            value={p.id}
            onSelect={handleCreateForm}
          >
            <div className="h-10 truncate px-2 leading-10 text-primary sm:h-9 sm:leading-9">
              {p.name}
            </div>
          </Command.Item>
        ))}
      </Command.Group>
    )
  }

  return (
    <Command.Item
      className="mx-2 cursor-pointer rounded-lg aria-selected:bg-accent"
      onSelect={handleCreateProject}
    >
      <div className="flex h-10 items-center gap-2 px-2 text-primary sm:h-9">
        <IconPlus className="h-5 w-5 text-secondary" />
        <span className="flex-1">{t('createProject')}</span>
      </div>
    </Command.Item>
  )
}

const SearchModalComponent = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaceId } = useParam()
  const { openModal, closeModal } = useAppStore()

  const defaultGroups: GroupType[] = useMemo(
    () => [
      {
        type: 'action',
        heading: t('dashboard.search.actions'),
        items: [
          {
            value: 'newWorkspace',
            icon: IconSquareRotated,
            title: t('dashboard.search.newWorkspace')
          },
          {
            value: 'newProject',
            icon: IconFolder,
            title: t('dashboard.search.newProject')
          },
          { value: 'newForm', icon: IconPlus, title: t('dashboard.search.newForm') }
        ]
      },
      {
        type: 'navigation',
        heading: t('dashboard.search.navigation'),
        items: [
          {
            value: TEMPLATES_URL,
            icon: IconStack2,
            title: t('workspace.sidebar.template')
          },
          { value: HELP_CENTER_URL, icon: IconHelp, title: t('workspace.sidebar.help') }
        ]
      }
    ],
    [t]
  )

  const [activePage, setActivePage] = useState('home')
  const [groups, setGroups] = useState<GroupType[]>(defaultGroups)
  const [query, setQuery] = useState<string>()

  const filteredGroups = useMemo(() => {
    if (!query) {
      return groups
    }

    const lowerQuery = query.toLowerCase()

    return groups
      .map(g => {
        if (g.type === 'form' || g.type === 'document') {
          return g
        }

        return {
          ...g,
          items: g.items.filter(i => i.title.toLowerCase().includes(lowerQuery))
        }
      })
      .filter(g => g.items.length > 0)
  }, [groups, query])

  const { loading, run: handleQueryChange } = useRequest(
    async (query: string) => {
      setQuery(helper.isEmpty(query) ? undefined : query)

      if (helper.isEmpty(query)) {
        return setGroups(defaultGroups)
      }

      const result = await WorkspaceService.search(workspaceId, query.trim())
      const _groups: GroupType[] = []

      if (result.forms.length > 0) {
        _groups.push({
          type: 'form',
          heading: t('dashboard.search.forms'),
          items: result.forms.map((f: any) => ({
            value: `/workspace/${f.teamId}/project/${f.projectId}/form/${f.id}/analytics`,
            title: f.name
          }))
        })
      }

      if (result.docs.length > 0) {
        _groups.push({
          type: 'document',
          heading: t('workspace.sidebar.help'),
          items: result.docs.map((d: any) => ({
            value: HELP_CENTER_URL + d.id,
            title: d.title,
            description: d.description
          }))
        })
      }

      setGroups([...defaultGroups, ..._groups])
    },
    {
      refreshDeps: [workspaceId],
      debounceWait: 300,
      manual: true
    }
  )

  function handleAction(value: string) {
    switch (value) {
      case 'newWorkspace':
        closeModal('SearchModal')
        openModal('CreateWorkspaceModal')
        break

      case 'newProject':
        closeModal('SearchModal')
        openModal('CreateProjectModal')
        break

      case 'newForm':
        setActivePage(value)
        break
    }
  }

  function handleSelect(item: string) {
    const { type, value } = toJSON(item)! as AnyMap

    switch (type) {
      case 'form':
        closeModal('SearchModal')
        return router.push(value)

      case 'navigation':
      case 'document':
        closeModal('SearchModal')
        return window.open(value, '_blank')

      case 'action':
        return handleAction(value)
    }
  }

  return (
    <Command shouldFilter={false}>
      <div className="flex items-center gap-2 border-b border-input px-4 py-3">
        {activePage === 'newForm' ? (
          <Button.Link className="-ml-1" size="sm" iconOnly onClick={() => setActivePage('home')}>
            <IconArrowLeft className="h-5 w-5" />
          </Button.Link>
        ) : (
          <>
            <IconSearch className="h-5 w-5 text-secondary" />
            <Command.Input
              className="flex-1 border-none bg-transparent p-0 text-sm/6 text-primary outline-none focus:outline-none focus:ring-0"
              placeholder={t('dashboard.search.placeholder')}
              autoFocus
              onValueChange={handleQueryChange}
            />
            {loading && <Loader />}
          </>
        )}
      </div>

      <Command.List
        className={cn(
          'scrollbar sm:h-[min(25rem,var(--cmdk-list-height))] [&_[cmdk-list-sizer]]:space-y-4',
          {
            '[&_[cmdk-list-sizer]]:py-4': !loading
          }
        )}
      >
        {activePage === 'newForm' ? (
          <ProjectsPage />
        ) : (
          <>
            {!loading && (
              <Command.Empty className="px-4 text-sm/6">No results found.</Command.Empty>
            )}

            {filteredGroups.map(g => (
              <Command.Group
                key={g.heading}
                className="text-sm/6 text-secondary [&_[cmdk-group-heading]]:mb-0 [&_[cmdk-group-heading]]:px-4"
                heading={g.heading}
              >
                {g.items.map(row => (
                  <Command.Item
                    key={row.value}
                    className="mx-2 cursor-pointer rounded-lg aria-selected:bg-accent-light"
                    value={JSON.stringify({ type: g.type, value: row.value })}
                    onSelect={handleSelect}
                  >
                    <div className="flex h-10 items-center gap-2 px-2 text-primary sm:h-9">
                      {row.icon && <row.icon className="h-5 w-5 text-secondary" />}
                      <span className="flex-1 truncate">
                        {row.title}
                        {row.description && (
                          <span className="pl-2 text-secondary">{row.description}</span>
                        )}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </>
        )}
      </Command.List>
    </Command>
  )
}

export default function SearchModal() {
  const { isOpen, toggle, onOpenChange } = useModal('SearchModal')

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'KeyK' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', down)

    return () => {
      document.removeEventListener('keydown', down)
    }
  }, [])

  return (
    <Modal
      contentProps={{
        className: 'sm:max-w-[37.5rem] p-0',
        forceMount: true
      }}
      open={isOpen}
      onOpenChange={onOpenChange}
      isCloseButtonShow={false}
    >
      <SearchModalComponent />
    </Modal>
  )
}
