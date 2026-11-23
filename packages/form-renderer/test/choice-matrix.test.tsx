// @vitest-environment jsdom
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { FormRenderer } from '../src/Renderer'
import { initI18n } from '../src/i18n'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  Object.assign(window, { heyform: { device: { mobile: false } } })
  initI18n()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

async function mount(required: boolean) {
  const onSubmit = vi.fn(async () => {})
  await act(async () =>
    root.render(
      <FormRenderer
        locale="en"
        form={{
          id: 'matrix-form',
          fields: [
            {
              id: 'matrix',
              kind: FieldKindEnum.CHOICE_MATRIX,
              title: 'Rate your experience',
              validations: { required },
              properties: {
                matrixRows: [
                  { id: 'support', label: 'Support' },
                  { id: 'speed', label: 'Speed' }
                ],
                matrixColumns: [
                  { id: 'poor', label: 'Poor' },
                  { id: 'good', label: 'Good' }
                ]
              }
            }
          ]
        }}
        onSubmit={onSubmit}
      />
    )
  )
  return onSubmit
}

function radios() {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
}

async function submit() {
  await act(async () =>
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click()
  )
}

test('a required matrix stays on one screen and submits one selection per row', async () => {
  const onSubmit = await mount(true)
  const [supportPoor, supportGood, speedPoor, speedGood] = radios()
  expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(2)

  await act(async () => supportPoor.click())
  await submit()
  expect(onSubmit).not.toHaveBeenCalled()
  expect(container.querySelector('.heyform-validation-error')?.textContent).toBe(
    'This field is required'
  )

  await act(async () => supportGood.click())
  expect(supportPoor.checked).toBe(false)
  expect(supportGood.checked).toBe(true)
  expect(speedPoor.checked).toBe(false)

  await act(async () => speedGood.click())
  await submit()
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(onSubmit.mock.calls[0][0]).toEqual({
    matrix: [
      { rowId: 'support', columnId: 'good' },
      { rowId: 'speed', columnId: 'good' }
    ]
  })
})

test('an optional matrix submits with unanswered rows', async () => {
  const onSubmit = await mount(false)
  await act(async () => radios()[1].click())
  await submit()
  expect(onSubmit.mock.calls[0][0]).toEqual({
    matrix: [{ rowId: 'support', columnId: 'good' }]
  })
})
