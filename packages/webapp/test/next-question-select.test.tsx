// @vitest-environment jsdom
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { act } from 'react'
import { Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { initFields } from '../src/pages/form/Builder/utils'

import i18n from '../src/i18n'
import { NextQuestionSelect } from '../src/pages/form/Builder/LogicModal/NextQuestionSelect'

let root: Root
let container: HTMLDivElement

const { fields } = initFields(
  [
    { id: 'a', title: 'First', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'b', title: 'Second', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU }
  ] as unknown as Parameters<typeof initFields>[0],
  []
)

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

async function render(value: string | undefined, onChange = vi.fn()) {
  await act(async () =>
    root.render(
      // Radix only renders its hidden native select inside a form, like in LogicModal
      <form>
        <NextQuestionSelect
          fields={fields}
          currentField={fields[0]}
          value={value}
          onChange={onChange}
        />
      </form>
    )
  )
  return onChange
}

async function pick(label: string) {
  const select = container.querySelector('select')!
  const option = [...select.options].find(o => o.textContent === label)!
  await act(async () => {
    select.value = option.value
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

test('uses the themed dropdown instead of a native one', async () => {
  await render(undefined)
  const trigger = container.querySelector('button[role="combobox"]')
  expect(trigger).toBeTruthy()
  expect(trigger!.textContent).toContain('Next in form order')
  expect(trigger!.getAttribute('aria-label')).toBe('Next question')
})

test('maps "Next in form order" back to an empty value', async () => {
  const onChange = await render('end')
  const trigger = container.querySelector('button[role="combobox"]')
  expect(trigger).toBeTruthy()
  expect(trigger!.textContent).toContain('Thanks')

  await pick('Next in form order')
  expect(onChange).toHaveBeenLastCalledWith('')
})

test('passes a chosen question through unchanged', async () => {
  const onChange = await render(undefined)
  await pick('2 Second')
  expect(onChange).toHaveBeenLastCalledWith('b')
})
