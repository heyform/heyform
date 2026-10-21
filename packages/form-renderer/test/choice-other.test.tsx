// @vitest-environment jsdom
import { act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ChoiceRadioGroup } from '../src/components'
import { initI18n } from '../src/i18n'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  initI18n()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

const options = [
  { keyName: 'A', label: 'Motion', value: 'motion' },
  { keyName: 'B', label: 'Producer', value: 'producer' }
]

// Keeps the value like the form field does, so each change sees the previous one.
async function mount(props: { allowMultiple?: boolean; allowBlankOther?: boolean }) {
  const onChange = vi.fn()

  function Group() {
    const [value, setValue] = useState<any>()

    return (
      <ChoiceRadioGroup
        options={options}
        allowOther={true}
        value={value}
        onChange={next => {
          onChange(next)
          setValue(next)
        }}
        {...props}
      />
    )
  }

  await act(async () => root.render(<Group />))
  return onChange
}

function other() {
  return container.querySelector<HTMLElement>('.heyform-radio-other')!
}

async function click(element: HTMLElement) {
  await act(async () => element.click())
}

async function press(key: string) {
  await act(async () => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

async function type(text: string) {
  const input = other().querySelector('input')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function isOtherChecked() {
  return other().classList.contains('heyform-radio-selected')
}

test('clicking "Other" answers it blank when text is optional', async () => {
  const onChange = await mount({ allowBlankOther: true })

  await click(other())
  expect(onChange).toHaveBeenLastCalledWith({ value: [], other: '' })
  expect(isOtherChecked()).toBe(true)

  await type('Editor')
  expect(onChange).toHaveBeenLastCalledWith({ value: [], other: 'Editor' })

  // Clearing the text, or leaving the field, keeps "Other" chosen.
  await type('')
  expect(onChange).toHaveBeenLastCalledWith({ value: [], other: '' })
  await act(async () => other().querySelector('input')!.dispatchEvent(new FocusEvent('blur')))
  expect(isOtherChecked()).toBe(true)

  // Choosing an option replaces "Other" on a single-select question.
  await click(container.querySelector<HTMLElement>('.heyform-radio')!)
  expect(onChange).toHaveBeenLastCalledWith({ value: ['motion'] })
  expect(isOtherChecked()).toBe(false)
})

test('a checked, empty "Other" toggles off on a multi-select question, by click or hotkey', async () => {
  const onChange = await mount({ allowBlankOther: true, allowMultiple: true })

  await click(container.querySelector<HTMLElement>('.heyform-radio')!)
  await press('c')
  expect(onChange).toHaveBeenLastCalledWith({ value: ['motion'], other: '' })
  expect(isOtherChecked()).toBe(true)

  await press('c')
  expect(onChange).toHaveBeenLastCalledWith({ value: ['motion'], other: undefined })
  expect(isOtherChecked()).toBe(false)

  await click(other())
  await type('Blender')
  // With text in it, clicking the row doesn't throw the answer away.
  await click(other())
  expect(onChange).toHaveBeenLastCalledWith({ value: ['motion'], other: 'Blender' })
  expect(isOtherChecked()).toBe(true)
})

test('"Other" still needs text when blank answers aren\'t allowed', async () => {
  const onChange = await mount({})

  await click(other())
  expect(onChange).toHaveBeenLastCalledWith({ value: [], other: undefined })

  await type('Editor')
  await type('')
  expect(onChange).toHaveBeenLastCalledWith({ value: [], other: undefined })
  expect(isOtherChecked()).toBe(false)
})
