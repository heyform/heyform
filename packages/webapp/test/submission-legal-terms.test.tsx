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

const field = { id: 'terms', title: 'Terms', kind: FieldKindEnum.LEGAL_TERMS }

async function cell(value: unknown) {
  await act(async () =>
    root.render(
      <SubmissionCell
        field={field as any}
        submission={{ id: 's1' } as any}
        answer={{ id: 'terms', kind: field.kind, title: 'Terms', value } as any}
        isTableCell
      />
    )
  )
  return container.textContent
}

test('a legal terms answer shows which option was chosen', async () => {
  expect(await cell(true)).toBe('I accept')
  expect(await cell(false)).toBe("I don't accept")
  expect(await cell(undefined)).toBe('')
})
