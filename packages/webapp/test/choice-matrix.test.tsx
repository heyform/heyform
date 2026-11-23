// @vitest-environment jsdom
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { getFieldFromKind } from '../src/pages/form/Builder/utils/field'

import i18n from '../src/i18n'
import { ChoiceMatrix } from '../src/pages/form/Builder/Compose/Blocks/ChoiceMatrix'
import { StoreContext } from '../src/pages/form/Builder/store/context'
import SubmissionCell from '../src/pages/form/Submissions/SubmissionCell'
import type { FormFieldType, SubmissionType } from '../src/types'

vi.mock('../src/pages/form/Builder/Compose/Blocks/Block', () => ({
  Block: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}))

let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

function button(label: string) {
  return Array.from(container.querySelectorAll('button')).find(
    button => (button.getAttribute('aria-label') ?? button.textContent) === label
  )!
}

test('builder adds, edits, and removes rows and columns while retaining the other axis', async () => {
  const original = getFieldFromKind(FieldKindEnum.CHOICE_MATRIX)
  const changes = vi.fn()

  function Editor() {
    const [field, setField] = useState(original)
    return (
      <StoreContext.Provider
        value={{
          state: {} as never,
          dispatch: action => {
            if (action.type === 'updateField') {
              changes(action.payload.updates)
              setField(current => ({ ...current, ...action.payload.updates }))
            }
          }
        }}
      >
        <ChoiceMatrix field={field} locale="en" />
      </StoreContext.Provider>
    )
  }

  await act(async () => root.render(<Editor />))
  await act(async () => button('Add row').click())
  await act(async () => button('Add column').click())
  const label = container.querySelector<HTMLInputElement>('input[aria-label="Row 3"]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
      label,
      'Delivery'
    )
    label.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const matrix = changes.mock.lastCall?.[0].properties
  expect(matrix.matrixRows.slice(0, 2)).toEqual(original.properties?.matrixRows)
  expect(matrix.matrixRows[2].label).toBe('Delivery')
  expect(matrix.matrixColumns).toHaveLength(4)
  await act(async () => button('Remove Col 4').click())
  await act(async () => button('Remove Row 3').click())
  expect(changes.mock.lastCall?.[0].properties).toMatchObject(original.properties!)
})

test('submission details use the row and option labels saved with the answer', async () => {
  const field = getFieldFromKind(FieldKindEnum.CHOICE_MATRIX)
  const answer = {
    id: field.id,
    kind: field.kind,
    title: 'Survey',
    properties: {
      matrixRows: [
        { id: 'wait', label: 'Wait time' },
        { id: 'staff', label: 'Staff' }
      ],
      matrixColumns: [{ id: 'great', label: 'Great' }]
    },
    value: [{ rowId: 'staff', columnId: 'great' }]
  }
  await act(async () =>
    root.render(
      <SubmissionCell
        field={field as FormFieldType}
        submission={{} as SubmissionType}
        answer={answer}
      />
    )
  )
  expect(Array.from(container.querySelectorAll('dt, dd'), cell => cell.textContent)).toEqual([
    'Wait time',
    '—',
    'Staff',
    'Great'
  ])
})
