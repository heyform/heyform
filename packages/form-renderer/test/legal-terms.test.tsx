// @vitest-environment jsdom
import { FieldKindEnum, type FormField } from '@heyform-inc/shared-types-enums'
import { act, useReducer } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { LegalTerms } from '../src/blocks/LegalTerms'
import { initI18n } from '../src/i18n'
import { type IState, StoreContext, StoreReducer } from '../src/store'

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
  vi.useRealTimers()
})

function terms(required: boolean): FormField {
  return { id: 'terms', kind: FieldKindEnum.LEGAL_TERMS, title: 'Terms', validations: { required } }
}

const name: FormField = { id: 'name', kind: FieldKindEnum.SHORT_TEXT, title: 'Name' }

async function mount(field: FormField, alwaysShowNextButton = false) {
  const initialState: IState = {
    instanceId: 'test',
    formId: 'legal-terms-test',
    allFields: [field, name],
    fields: [field, name],
    thankYouFields: [],
    hiddenFields: [],
    jumpFieldIds: [],
    logics: [],
    values: {},
    scrollIndex: 0,
    isScrollNextDisabled: false,
    alwaysShowNextButton,
    query: {},
    locale: 'en',
    theme: {},
    questionCount: 0,
    percentage: 0,
    passedFieldIds: []
  }

  function Respondent() {
    const [state, dispatch] = useReducer(StoreReducer, initialState)
    const current = state.fields[state.scrollIndex!]

    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        <output data-question={current.id} data-values={JSON.stringify(state.values)} />
        {current.kind === FieldKindEnum.LEGAL_TERMS && <LegalTerms field={current} />}
      </StoreContext.Provider>
    )
  }

  await act(async () => root.render(<Respondent />))
}

function question() {
  return container.querySelector('output')!.dataset.question
}

function values() {
  return JSON.parse(container.querySelector('output')!.dataset.values!)
}

function error() {
  return container.querySelector('.heyform-validation-error')?.textContent
}

async function choose(label: string) {
  const option = Array.from(container.querySelectorAll<HTMLElement>('.heyform-radio')).find(radio =>
    radio.textContent?.includes(label)
  )!

  await act(async () => option.click())
  // Choosing an answer submits the block after a short delay.
  await act(async () => vi.advanceTimersByTimeAsync(600))
}

async function next() {
  const button = container.querySelector<HTMLButtonElement>('button[type="submit"]')!
  await act(async () => button.click())
}

test('a required block with no answer stays put and says why', async () => {
  await mount(terms(true), true)

  await next()

  expect(question()).toBe('terms')
  expect(error()).toBe('This field is required')
})

test('a required block can only be passed by accepting', async () => {
  vi.useFakeTimers()
  await mount(terms(true))

  await choose("I don't accept")

  expect(question()).toBe('terms')
  expect(error()).toBe('This field is required')

  await choose('I accept')

  expect(question()).toBe('name')
  expect(values()).toEqual({ terms: true })
})

test('an optional block can be declined', async () => {
  vi.useFakeTimers()
  await mount(terms(false))

  await choose("I don't accept")

  expect(question()).toBe('name')
  expect(values()).toEqual({ terms: false })
})
