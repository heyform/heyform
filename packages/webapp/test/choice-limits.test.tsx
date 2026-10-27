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

async function press(label: string, index = 0) {
  const buttons = Array.from(container.querySelectorAll(`button[aria-label="${label}"]`))

  await act(async () => (buttons[index] as HTMLButtonElement).click())
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

test('only whole numbers of at least 1 are kept', async () => {
  await mount()

  await type(inputs()[0], 'abc')
  expect(limitOf(0)).toBeUndefined()
  expect(inputs()[0].value).toBe('')

  await type(inputs()[0], '0')
  expect(limitOf(0)).toBeUndefined()

  await type(inputs()[0], '12')
  expect(limitOf(0)).toBe(12)

  await type(inputs()[0], '12a')
  expect(limitOf(0)).toBe(12)
  expect(inputs()[0].value).toBe('12')
})

test('the arrows increase and decrease the limit, and going below 1 removes it', async () => {
  await mount()

  await press('Increase limit')
  expect(limitOf(0)).toBe(1)

  await press('Increase limit')
  expect(limitOf(0)).toBe(2)

  await press('Decrease limit')
  expect(limitOf(0)).toBe(1)

  await press('Decrease limit')
  expect(limitOf(0)).toBeUndefined()
  expect(inputs()[0].value).toBe('')
  expect(inputs()[0].placeholder).toBe('Unlimited')

  // Decreasing an unlimited choice keeps it unlimited
  await press('Decrease limit')
  expect(limitOf(0)).toBeUndefined()
})

test('an existing limit is shown and the other choice stays untouched', async () => {
  await mount(3)

  expect(inputs()[0].value).toBe('3')
  expect(inputs()[1].value).toBe('')

  await press('Increase limit', 1)
  expect(limitOf(0)).toBe(3)
  expect(limitOf(1)).toBe(1)
})
