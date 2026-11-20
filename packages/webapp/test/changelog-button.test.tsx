// @vitest-environment jsdom
import axios from 'axios'
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ChangelogService } from '../src/services'

import i18n from '../src/i18n'
import ChangelogButton from '../src/layouts/Workspace/ChangelogButton'
import ChangelogsModal from '../src/layouts/Workspace/ChangelogsModal'
import { useAppStore } from '../src/store'

vi.mock('@/consts', async importOriginal => ({
  ...(await importOriginal<typeof import('../src/consts')>()),
  PACKAGE_VERSION: '3.0.9'
}))

let root: Root
let container: HTMLDivElement

function release(version: string) {
  return {
    id: 1,
    version,
    changelog: '## What changed',
    url: `https://github.com/heyform/heyform/releases/tag/${version}`,
    publishedAt: '2026-10-24T13:10:51Z'
  }
}

async function renderButton() {
  await act(async () => root.render(<ChangelogButton />))
  await act(async () => {})
}

const badge = () => container.querySelector('.animate-ping')
const link = () => container.querySelector('a') as HTMLAnchorElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  useAppStore.setState({ modals: new Map() })
  vi.restoreAllMocks()
})

test('the badge stays after opening the changelog of a newer version', async () => {
  const latest = release('v3.0.10')
  vi.spyOn(ChangelogService, 'latest').mockResolvedValue(latest)
  await renderButton()
  expect(badge()).not.toBeNull()

  await act(async () => link().click())

  expect(useAppStore.getState().modals.get('ChangelogsModal')).toEqual(latest)
  expect(badge()).not.toBeNull()
})

test('the changelog renders bare URLs and Markdown links while preserving inline code', async () => {
  const pullRequest = 'https://github.com/heyform/heyform/pull/385'
  const compare = 'https://github.com/heyform/heyform/compare/v3.0.6...v3.0.7'
  await act(async () => {
    useAppStore.getState().openModal('ChangelogsModal', {
      ...release('v3.0.10'),
      changelog: `- Fixed notifications in ${pullRequest}.\n- [Full changelog](${compare})\n- \`${pullRequest}\``
    })
    root.render(<ChangelogsModal />)
  })

  const changelog = document.querySelector('.changelog')!
  expect(Array.from(changelog.querySelectorAll('a'), a => [a.textContent, a.href])).toEqual([
    [pullRequest, pullRequest],
    ['Full changelog', compare]
  ])
  expect(changelog.querySelector('code')?.textContent).toBe(pullRequest)
})

test.each(['v3.0.9', 'v3.0.8'])('no badge when the latest release is %s', async version => {
  vi.spyOn(ChangelogService, 'latest').mockResolvedValue(release(version))
  await renderButton()

  expect(badge()).toBeNull()
})

test('falls back to the GitHub releases page without a release to show', async () => {
  vi.spyOn(ChangelogService, 'latest').mockResolvedValue(null)
  await renderButton()
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })

  await act(async () => link().dispatchEvent(event))

  expect(badge()).toBeNull()
  expect(event.defaultPrevented).toBe(false)
  expect(useAppStore.getState().modals.has('ChangelogsModal')).toBe(false)
})

test('latest returns null when the API has no changelog', async () => {
  vi.spyOn(axios, 'get').mockResolvedValue({ data: '' })

  expect(await ChangelogService.latest()).toBeNull()
})

test('latest returns the release from the API', async () => {
  const latest = release('v3.0.10')
  vi.spyOn(axios, 'get').mockResolvedValue({ data: latest })

  expect(await ChangelogService.latest()).toEqual(latest)
})
