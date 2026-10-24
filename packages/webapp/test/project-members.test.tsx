// @vitest-environment jsdom
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ProjectService, WorkspaceService } from '../src/services'

import i18n from '../src/i18n'
import ProjectMembers from '../src/layouts/Project/ProjectMembers'
import ProjectMembersModal from '../src/layouts/Project/ProjectMembersModal'
import { ProjectShell } from '../src/layouts/Project/ProjectShell'
import LegacyProjectMembers from '../src/pages/project/Members'
import { useAppStore, useUserStore, useWorkspaceStore } from '../src/store'
import type { MemberType, WorkspaceType } from '../src/types'

let root: Root
let container: HTMLDivElement
const members = [
  { id: 'owner', name: 'Owner', email: 'owner@example.com' },
  { id: 'member', name: 'Member', email: 'member@example.com' }
] as MemberType[]

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  useUserStore.getState().setUser({ id: 'owner', name: 'Owner' } as any)
  const store = useWorkspaceStore.getState()
  store.setWorkspaces([
    {
      id: 'workspace',
      ownerId: 'owner',
      isOwner: true,
      projects: [{ id: 'project', name: 'Research', members: ['owner'] }]
    } as WorkspaceType
  ])
  store.selectWorkspace('workspace')
  store.selectProject('project')
  store.setMembers('workspace', members)
  vi.spyOn(WorkspaceService, 'members').mockResolvedValue(members)
  vi.spyOn(ProjectService, 'addMember').mockResolvedValue(true as never)
  vi.spyOn(ProjectService, 'removeMember').mockResolvedValue(true as never)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

async function click(button: HTMLButtonElement) {
  await act(async () => button.click())
}

function action(label: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
    button => button.textContent?.trim() === label
  )!
}

test('the plus opens the member dialog; adding and removing updates project membership', async () => {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/workspace/workspace/project/project/']}>
        <Routes>
          <Route
            path="/workspace/:workspaceId/project/:projectId/"
            element={
              <>
                <ProjectMembers />
                <ProjectMembersModal />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    )
  )
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  await click(container.querySelector('button[aria-label]')!)
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    i18n.t('project.members.headline')
  )
  expect(action(i18n.t('project.members.remove'))).toBeUndefined()
  await click(action(i18n.t('project.members.add')))
  expect(ProjectService.addMember).toHaveBeenCalledWith('project', 'member')
  expect(useWorkspaceStore.getState().project?.members).toContain('member')
  await click(action(i18n.t('project.members.remove')))
  expect(ProjectService.removeMember).toHaveBeenCalledWith('project', 'member')
  expect(useWorkspaceStore.getState().project?.members).not.toContain('member')
  await click(action(i18n.t('components.close')))
  expect(useAppStore.getState().modals.has('ProjectMembersModal')).toBe(false)
})

test('an existing members URL opens the dialog on the project page', async () => {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/workspace/workspace/project/project/members']}>
        <Routes>
          <Route
            path="/workspace/:workspaceId/project/:projectId/members"
            element={
              <ProjectShell>
                <LegacyProjectMembers />
              </ProjectShell>
            }
          />
          <Route
            path="/workspace/:workspaceId/project/:projectId/"
            element={
              <ProjectShell>
                <div>Project forms</div>
              </ProjectShell>
            }
          />
        </Routes>
      </MemoryRouter>
    )
  )
  expect(container.textContent).toContain('Project forms')
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    i18n.t('project.members.headline')
  )
})
