import {
  IconArrowLeft,
  IconFolder,
  IconPlus,
  IconSearch,
  IconSquareRotated
} from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { Command } from 'cmdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { WorkspaceService } from '@/services'
import { cn, useParam, useRouter } from '@/utils'
import { helper, toJSON } from '@heyform-inc/utils'

import { Button, Loader, Modal } from '@/components'
import { HELP_CENTER_URL } from '@/consts'
import { useAppStore, useModal, useWorkspaceStore } from '@/store'

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
        className="text-secondary select-none text-sm/6 [&_[cmdk-group-heading]]:mb-0 [&_[cmdk-group-heading]]:px-4"
        heading={t('dashboard.search.selectProject')}
      >
        {workspace!.projects.map(p => (
          <Command.Item
            key={p.id}
            className="aria-selected:bg-accent mx-2 cursor-pointer rounded-lg"
            value={p.id}
            onSelect={handleCreateForm}
          >
            <div className="text-primary h-10 truncate px-2 leading-10 sm:h-9 sm:leading-9">
              {p.name}
            </div>
          </Command.Item>
        ))}
      </Command.Group>
    )
  }

  return (
    <Command.Item
      className="aria-selected:bg-accent mx-2 cursor-pointer rounded-lg"
      onSelect={handleCreateProject}
    >
      <div className="text-primary flex h-10 items-center gap-2 px-2 sm:h-9">
        <IconPlus className="text-secondary h-5 w-5" />
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
      <div className="border-input flex items-center gap-2 border-b px-4 py-3">
        {activePage === 'newForm' ? (
          <Button.Link className="-ml-1" size="sm" iconOnly onClick={() => setActivePage('home')}>
            <IconArrowLeft className="h-5 w-5" />
          </Button.Link>
        ) : (
          <>
            <IconSearch className="text-secondary h-5 w-5" />
            <Command.Input
              className="text-primary flex-1 border-none bg-transparent p-0 text-sm/6 outline-none focus:outline-none focus:ring-0"
              placeholder={t('dashboard.search.placeholder')}
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
              <Command.Empty className="px-4 text-sm/6">
                {t('dashboard.search.emptyState')}
              </Command.Empty>
            )}

            {filteredGroups.map(g => (
              <Command.Group
                key={g.heading}
                className="text-secondary text-sm/6 [&_[cmdk-group-heading]]:mb-0 [&_[cmdk-group-heading]]:px-4"
                heading={g.heading}
              >
                {g.items.map(row => (
                  <Command.Item
                    key={row.value}
                    className="aria-selected:bg-accent-light mx-2 cursor-pointer rounded-lg"
                    value={JSON.stringify({ type: g.type, value: row.value })}
                    onSelect={handleSelect}
                  >
                    <div className="text-primary flex h-10 items-center gap-2 px-2 sm:h-9">
                      {row.icon && <row.icon className="text-secondary h-5 w-5" />}
                      <span className="flex-1 truncate">
                        {row.title}
                        {row.description && (
                          <span className="text-secondary pl-2">{row.description}</span>
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
