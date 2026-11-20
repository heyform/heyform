// @vitest-environment jsdom
import { FieldKindEnum, type FormField as FormFieldType } from '@heyform-inc/shared-types-enums'
import { act, useReducer } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Form } from '../src/blocks/Form'
import { FormField, Input } from '../src/components'
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
})

async function mount(required: boolean) {
  const field: FormFieldType = {
    id: 'number',
    title: 'Number',
    kind: FieldKindEnum.NUMBER,
    validations: { required }
  }
  const onSubmit = vi.fn(async () => undefined)
  const initialState: IState = {
    instanceId: 'test',
    formId: 'number-input-test',
    allFields: [field],
    thankYouFields: [],
    fields: [field],
    hiddenFields: [],
    jumpFieldIds: [],
    logics: [],
    values: { number: 42 },
    scrollIndex: 0,
    isScrollNextDisabled: false,
    query: {},
    locale: 'en',
    theme: {},
    questionCount: 1,
    percentage: 0,
    passedFieldIds: [],
    onSubmit
  }

  function Respondent() {
    const [state, dispatch] = useReducer(StoreReducer, initialState)
    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        <Form field={field} initialValues={{ input: state.values.number }} getValues={v => v.input}>
          <FormField name="input" rules={[{ required, type: 'number' }]}>
            <Input type="number" />
          </FormField>
        </Form>
      </StoreContext.Provider>
    )
  }

  await act(async () => root.render(<Respondent />))
  return onSubmit
}

async function change(value: string) {
  const input = container.querySelector('input')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function submit() {
  await act(async () => {
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

test('clearing a required number leaves it empty and prevents submission', async () => {
  const onSubmit = await mount(true)
  await change('')
  expect(container.querySelector('input')!.value).toBe('')
  await submit()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('clearing an optional number submits an unanswered value', async () => {
  const onSubmit = await mount(false)
  await change('')
  expect(container.querySelector('input')!.value).toBe('')
  await submit()
  expect(onSubmit).toHaveBeenCalledWith({ number: undefined }, false, undefined)
})

test('zero remains a valid answer to a required number question', async () => {
  const onSubmit = await mount(true)
  await change('')
  await change('0')
  await submit()
  expect(onSubmit).toHaveBeenCalledWith({ number: 0 }, false, undefined)
})
