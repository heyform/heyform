// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, test, vi } from 'vitest'

import i18n from '../src/i18n'
import AccountApiAccess from '../src/layouts/Workspace/AccountApiAccess'

test('only permits scopes available in every selected workspace', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const read = ['workspaces:read', 'members:read']
  const scopes = [...read, 'workspaces:write']
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        keys: [],
        scopes,
        workspaces: [
          { id: 'owned', name: 'Owned workspace', scopes },
          { id: 'other', name: 'Member workspace', scopes: read }
        ]
      })
    )
    .mockResolvedValueOnce(
      Response.json(
        {
          id: 'key',
          name: 'Automation',
          expiresAt: null,
          revokedAt: null,
          workspaceAccess: 'selected',
          workspaceIds: ['owned', 'other'],
          scopes: read,
          token: 'test'
        },
        { status: 201 }
      )
    )
  vi.stubGlobal('fetch', fetchMock)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  async function click(element: HTMLElement | null | undefined) {
    expect(element).toBeTruthy()
    await act(async () => element!.click())
  }

  function check(dialog: Element, label: string, checked: boolean, disabled: boolean) {
    const checkbox = dialog.querySelector<HTMLButtonElement>(
      '[role=checkbox][aria-label="' + label + '"]'
    )!
    expect(checkbox.getAttribute('aria-checked')).toBe(String(checked))
    expect(checkbox.disabled).toBe(disabled)
  }

  try {
    await i18n.changeLanguage('en')
    await act(async () => root.render(<AccountApiAccess />))
    await click(
      [...container.querySelectorAll('button')].find(
        button => button.textContent?.trim() === 'Create API key'
      )
    )
    const dialog = document.querySelector('[role=dialog]')!
    check(dialog, 'View workspaces', true, false)
    check(dialog, 'Edit workspace settings', false, true)

    await click(dialog.querySelector('input[id$="-selected"]'))
    check(dialog, 'View workspaces', false, true)
    await click(dialog.querySelector('[aria-label="Owned workspace"]'))
    check(dialog, 'Edit workspace settings', true, false)
    await click(dialog.querySelector('[aria-label="Member workspace"]'))
    check(dialog, 'Edit workspace settings', false, true)

    await act(async () => {
      const input = dialog.querySelector<HTMLInputElement>('input[required]')!
      input.value = 'Automation'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(dialog.querySelector('button[type=submit]'))
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      workspaceAccess: 'selected',
      workspaceIds: ['owned', 'other'],
      scopes: read
    })
  } finally {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  }
})
