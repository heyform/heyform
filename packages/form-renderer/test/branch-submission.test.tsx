// @vitest-environment jsdom
import {
  ActionEnum,
  type AnswerValue,
  ComparisonEnum,
  FieldKindEnum,
  type FormField,
  type Logic
} from '@heyform-inc/shared-types-enums'
import { Field } from 'rc-field-form'
import { act, useReducer } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { applyLogicToFields } from '@heyform-inc/answer-utils'

import { Form } from '../src/blocks/Form'
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

function question(id: string, required = false, nextFieldId?: string): FormField {
  return { id, kind: FieldKindEnum.SHORT_TEXT, title: id, validations: { required }, nextFieldId }
}

function ending(id: string): FormField {
  return { id, kind: FieldKindEnum.THANK_YOU, title: id }
}

function navigate(fieldId: string, targetId: string, expected = 'yes'): Logic {
  return {
    fieldId,
    payloads: [
      {
        id: `${fieldId}-${targetId}`,
        condition: { comparison: ComparisonEnum.IS, expected },
        action: { kind: ActionEnum.NAVIGATE, fieldId: targetId }
      }
    ]
  }
}

async function mount(
  fields: FormField[],
  logics: Logic[],
  values: Record<string, AnswerValue> = {}
) {
  const onSubmit = vi.fn(async () => {})
  const thankYouFields = fields.filter(field => field.kind === FieldKindEnum.THANK_YOU)
  const initialState: IState = {
    instanceId: 'test',
    formId: 'branch-test',
    allFields: fields.filter(field => field.kind !== FieldKindEnum.THANK_YOU),
    thankYouFields,
    hiddenFields: [],
    jumpFieldIds: logics.map(logic => logic.fieldId),
    logics,
    values,
    ...applyLogicToFields(fields, logics, [], values),
    scrollIndex: 0,
    isScrollNextDisabled: false,
    query: {},
    locale: 'en',
    theme: {},
    questionCount: 0,
    percentage: 0,
    onSubmit
  }

  // Keep the real Form and reducer together: a React dispatch does not update the
  // state captured by the submit handler before it decides whether to submit.
  function Respondent() {
    const [state, dispatch] = useReducer(StoreReducer, initialState)
    const field = state.fields[state.scrollIndex!]

    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        {state.isSubmitted ? (
          <output data-ending={state.thankYouFieldId} />
        ) : (
          <>
            <output
              data-question={field.id}
              data-percentage={state.percentage}
              data-values={JSON.stringify(state.values)}
            />
            {field.kind === FieldKindEnum.STATEMENT ? (
              <Form key={field.id} field={field} />
            ) : (
              <Form
                key={field.id}
                field={field}
                initialValues={{ input: state.values[field.id] ?? '' }}
                getValues={value => value.input}
              >
                <Field name="input" rules={[{ required: field.validations?.required }]}>
                  <input aria-label={field.id} />
                </Field>
              </Form>
            )}
            <button type="button" onClick={() => dispatch({ type: 'scrollPrevious' })}>
              Back
            </button>
          </>
        )}
      </StoreContext.Provider>
    )
  }

  await act(async () => root.render(<Respondent />))
  return onSubmit
}

async function answer(value: string) {
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

async function back() {
  await act(async () => {
    container.querySelector<HTMLButtonElement>('button[type="button"]')!.click()
  })
}

function currentQuestion() {
  return container.querySelector('output')?.getAttribute('data-question')
}

test.each([false, true])(
  'a submitted answer opens the optional/required branch (required=%s)',
  async required => {
    const onSubmit = await mount(
      [question('q1', false, 'end'), question('q2', required), ending('end')],
      [navigate('q1', 'q2')]
    )
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe('Submit')

    await answer('yes')
    await submit()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(currentQuestion()).toBe('q2')

    await answer('done')
    await submit()

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({ q1: 'yes', q2: 'done' }, false, undefined)
    expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('end')
  }
)

test('an answer that shortens the route submits without visiting a required question', async () => {
  const onSubmit = await mount(
    [question('q1'), question('q2', true), ending('default-end'), ending('end')],
    [navigate('q1', 'end')]
  )

  await answer('yes')
  await submit()

  expect(onSubmit).toHaveBeenCalledOnce()
  expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('end')
})

test('a matching conditional ending takes precedence over the explicit default ending', async () => {
  const onSubmit = await mount(
    [question('q1', false, 'default-end'), ending('default-end'), ending('conditional-end')],
    [navigate('q1', 'conditional-end')]
  )

  await answer('yes')
  await submit()

  expect(onSubmit).toHaveBeenCalledOnce()
  expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('conditional-end')
})

test('advancing a statement does not create an answer or increment progress', async () => {
  const onSubmit = await mount(
    [{ id: 'statement', kind: FieldKindEnum.STATEMENT }, question('q1', true), ending('end')],
    []
  )

  await submit()

  expect(currentQuestion()).toBe('q1')
  expect(onSubmit).not.toHaveBeenCalled()
  expect(container.querySelector('output')?.getAttribute('data-percentage')).toBe('0')
  expect(container.querySelector('output')?.getAttribute('data-values')).toBe('{}')
})

test('clearing a branch answer preserves partial submission behavior', async () => {
  const onSubmit = await mount(
    [question('q1'), question('q2', true), ending('end')],
    [navigate('q1', 'end')],
    { q1: 'yes' }
  )

  await answer('')
  await submit()

  expect(onSubmit).not.toHaveBeenCalled()
  expect(currentQuestion()).toBe('q1')
  expect(container.querySelector('output')?.getAttribute('data-values')).toBe('{"q1":""}')

  await submit()

  expect(onSubmit).toHaveBeenCalledWith({ q1: '' }, true, undefined)
  expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('end')
})

test.each(['no', ''])(
  'changing an earlier answer to "%s" uses the new route and its default ending',
  async value => {
    const onSubmit = await mount(
      [
        question('q1', false, 'default-end'),
        question('q2', true),
        ending('other-end'),
        ending('default-end')
      ],
      [navigate('q1', 'q2')],
      { q1: 'yes' }
    )

    await submit()
    expect(currentQuestion()).toBe('q2')
    await back()
    await answer(value)
    await submit()

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({ q1: value }, false, undefined)
    expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('default-end')
  }
)
