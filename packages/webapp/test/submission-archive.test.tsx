// @vitest-environment jsdom
import { SubmissionCategoryEnum } from '@heyform-inc/shared-types-enums'
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { SubmissionService } from '../src/services'

import i18n from '../src/i18n'
import FormSubmissions from '../src/pages/form/Submissions'
import { useFormStore } from '../src/store'

let root: Root
let container: HTMLDivElement

// Submissions on the server, by folder
let folders: Record<string, string[]>

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  Object.assign(Element.prototype, {
    scrollIntoView: () => {},
    hasPointerCapture: () => false,
    releasePointerCapture: () => {}
  })
  await i18n.changeLanguage('en')

  folders = {
    [SubmissionCategoryEnum.INBOX]: ['s1', 's2'],
    [SubmissionCategoryEnum.SPAM]: ['s3'],
    [SubmissionCategoryEnum.ARCHIVE]: ['s4']
  }

  vi.spyOn(SubmissionService, 'submissions').mockImplementation(async ({ category }) => {
    const ids = folders[category] || []

    return {
      total: ids.length,
      submissions: ids.map(id => ({ id, answers: [], endAt: 0 }))
    } as any
  })

  vi.spyOn(SubmissionService, 'updateCategory').mockImplementation(async input => {
    for (const key of Object.keys(folders)) {
      folders[key] = folders[key].filter(id => !input.submissionIds.includes(id))
    }
    folders[input.category].push(...input.submissionIds)

    return true as any
  })

  useFormStore.setState({ form: { id: 'f1', drafts: [], settings: {} } as any })

  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/form/f1/submissions']}>
        <Routes>
          <Route path="/form/:formId/submissions" element={<FormSubmissions />} />
        </Routes>
      </MemoryRouter>
    )
  )
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

function rowCheckboxes() {
  return Array.from(container.querySelectorAll('tbody [role="checkbox"]')) as HTMLElement[]
}

// The move buttons are icon-only, labelled like their tooltips
function button(label: string) {
  return container.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null
}

async function click(element: Element) {
  await act(async () => {
    ;(element as HTMLElement).click()
  })
}

async function openFolder(name: string) {
  const trigger = container.querySelector('button[role="combobox"]') as HTMLButtonElement

  await act(async () => {
    trigger.focus()
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })

  const option = Array.from(document.body.querySelectorAll('[role="option"]')).find(
    row => row.textContent === name
  ) as HTMLElement

  await act(async () => {
    option.focus()
    option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
}

test('the folder switcher lists Inbox, Spam and Archive', async () => {
  const trigger = container.querySelector('button[role="combobox"]') as HTMLButtonElement

  await act(async () => {
    trigger.focus()
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })

  const options = Array.from(document.body.querySelectorAll('[role="option"]')).map(
    row => row.textContent
  )

  expect(options).toEqual(['Inbox', 'Spam', 'Archive'])
})

test('selected inbox submissions can be archived, and moved back from the archive', async () => {
  expect(rowCheckboxes()).toHaveLength(2)

  await click(rowCheckboxes()[0])

  const archive = button('Move to Archive')
  expect(archive).not.toBeNull()

  await click(archive!)

  expect(SubmissionService.updateCategory).toHaveBeenLastCalledWith({
    formId: 'f1',
    submissionIds: ['s1'],
    category: SubmissionCategoryEnum.ARCHIVE
  })
  expect(rowCheckboxes()).toHaveLength(1)

  await openFolder('Archive')
  expect(rowCheckboxes()).toHaveLength(2)

  await click(rowCheckboxes()[0])

  // The archive offers a way back to the inbox, not another archive button
  expect(button('Move to Archive')).toBeNull()
  const move = button('Move to Inbox')
  expect(move).not.toBeNull()

  await click(move!)

  expect(SubmissionService.updateCategory).toHaveBeenLastCalledWith({
    formId: 'f1',
    submissionIds: ['s4'],
    category: SubmissionCategoryEnum.INBOX
  })
  expect(folders[SubmissionCategoryEnum.INBOX]).toEqual(['s2', 's4'])
})

test('spam has no archive button', async () => {
  await openFolder('Spam')
  await click(rowCheckboxes()[0])

  expect(button('Move to Inbox')).not.toBeNull()
  expect(button('Move to Archive')).toBeNull()
})

test('switching folders clears the selection', async () => {
  await click(rowCheckboxes()[0])
  expect(button('Move to Spam')).not.toBeNull()

  await openFolder('Archive')

  // Nothing is selected in the archive, so no move buttons show
  expect(button('Move to Inbox')).toBeNull()
  expect(SubmissionService.updateCategory).not.toHaveBeenCalled()
})
