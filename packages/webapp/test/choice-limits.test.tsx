// @vitest-environment jsdom
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { act, useReducer } from 'react'
import { Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { initFields } from '../src/pages/form/Builder/utils'

import i18n from '../src/i18n'
import MultipleChoiceSettings from '../src/pages/form/Builder/RightSidebar/Question/MultipleChoice'
import { IState, StoreContext, storeReducer } from '../src/pages/form/Builder/store'

let root: Root
let container: HTMLDivElement
// The field as the builder store currently holds it
let latest: any

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

async function mount(limit?: number) {
  const initial: IState = {
    formId: 'form',
    locale: 'en',
    version: 0,
    references: [],
    hiddenFields: [],
    activeTabName: 'design',
    variables: [],
    ...initFields(
      [
        {
          id: 'q',
          title: 'Workshop',
          kind: FieldKindEnum.MULTIPLE_CHOICE,
          properties: {
            choices: [
              { id: 'a', label: 'Tuesday', limit },
              { id: 'b', label: '' }
            ]
          }
        },
        { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU }
      ],
      []
    )
  }

  function Builder() {
    const [state, dispatch] = useReducer(storeReducer, initial)
    latest = state.fields.find(row => row.id === 'q')

    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        <MultipleChoiceSettings field={latest} />
      </StoreContext.Provider>
    )
  }

  await act(async () => root.render(<Builder />))
}

const inputs = () =>
  Array.from(container.querySelectorAll('input[placeholder="Unlimited"]')) as HTMLInputElement[]
const limitOf = (index: number) => latest.properties.choices[index].limit

// Types like a user: the browser reports the new value of the field, then fires an input event
async function type(input: HTMLInputElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!

  await act(async () => {
    setValue.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

test('every choice gets a field showing the Unlimited placeholder, with a fallback label', async () => {
  await mount()

  expect(inputs()).toHaveLength(2)
  expect(inputs().map(input => input.placeholder)).toEqual(['Unlimited', 'Unlimited'])
  expect(container.textContent).toContain('Tuesday')
  expect(container.textContent).toContain('Option 2')
})

test('typing a limit stores it, clearing it removes it and shows the placeholder again', async () => {
  await mount()

  await type(inputs()[0], '5')
  expect(limitOf(0)).toBe(5)
  expect(inputs()[0].value).toBe('5')

  await type(inputs()[0], '')
  expect(limitOf(0)).toBeUndefined()
  expect(inputs()[0].value).toBe('')
  expect(inputs()[0].placeholder).toBe('Unlimited')
})

test('the field is a plain number input and decimals are rounded down', async () => {
  await mount()

  expect(inputs()[0].type).toBe('number')

  await type(inputs()[0], '12')
  expect(limitOf(0)).toBe(12)

  // A decimal is rounded down, so the field never shows a limit that isn't stored
  await type(inputs()[0], '2.5')
  expect(limitOf(0)).toBe(2)
  expect(inputs()[0].value).toBe('2')
})

test('an existing limit is shown and the other choice stays untouched', async () => {
  await mount(3)

  expect(inputs()[0].value).toBe('3')
  expect(inputs()[1].value).toBe('')

  await type(inputs()[1], '4')
  expect(limitOf(0)).toBe(3)
  expect(limitOf(1)).toBe(4)
})
