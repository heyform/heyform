// @vitest-environment jsdom
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import i18n from '../src/i18n'
import SubmissionCell from '../src/pages/form/Submissions/SubmissionCell'

let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

const field = {
  id: 'role',
  title: 'Role',
  kind: FieldKindEnum.MULTIPLE_CHOICE,
  properties: {
    allowMultiple: true,
    allowOther: true,
    allowBlankOther: true,
    choices: [
      { id: 'motion', label: 'Motion' },
      { id: 'producer', label: 'Producer' }
    ]
  }
}

async function cell(value: unknown) {
  await act(async () =>
    root.render(
      <SubmissionCell
        field={field as any}
        submission={{ id: 's1' } as any}
        answer={{ id: 'role', kind: field.kind, title: 'Role', value } as any}
        isTableCell
      />
    )
  )
  return Array.from(container.querySelectorAll('span')).map(badge => badge.textContent)
}

test('a blank "Other" answer shows as "Other"', async () => {
  expect(await cell({ value: [], other: '' })).toEqual(['Other'])
  expect(await cell({ value: ['motion'], other: '' })).toEqual(['Motion', 'Other'])
  expect(await cell({ value: ['motion'], other: 'Editor' })).toEqual(['Motion', 'Editor'])
  expect(await cell({ value: ['motion'] })).toEqual(['Motion'])
  expect(await cell({ value: [] })).toEqual([])
})
