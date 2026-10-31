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

import { OTHER_CHOICE_ID, applyLogicToFields } from '@heyform-inc/answer-utils'

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
    passedFieldIds: [],
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
                // Choice answers are typed as JSON so one text input can drive every question.
                getValues={value =>
                  field.kind === FieldKindEnum.MULTIPLE_CHOICE && value.input
                    ? JSON.parse(value.input)
                    : value.input
                }
              >
                <Field name="input" rules={[{ required: field.validations?.required }]}>
                  <input aria-label={field.id} />
                </Field>
              </Form>
            )}
            <button type="button" onClick={() => dispatch({ type: 'scrollPrevious' })}>
              Back
            </button>
            <button type="button" data-next onClick={() => dispatch({ type: 'scrollNext' })}>
              Next
            </button>
            <button
              type="button"
              data-last
              onClick={() =>
                dispatch({
                  type: 'scrollToField',
                  payload: { fieldId: state.fields[state.fields.length - 1].id }
                })
              }
            >
              Last
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

async function next() {
  await act(async () => {
    container.querySelector<HTMLButtonElement>('button[data-next]')!.click()
  })
}

function currentQuestion() {
  return container.querySelector('output')?.getAttribute('data-question')
}

function currentPercentage() {
  return container.querySelector('output')?.getAttribute('data-percentage')
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

test.each(['Producer', ''])(
  'an "Other" answer ("%s") follows the "Other" branch of a branching choice question',
  async other => {
    const role: FormField = {
      id: 'role',
      kind: FieldKindEnum.MULTIPLE_CHOICE,
      title: 'role',
      validations: { required: true },
      properties: {
        allowOther: true,
        // A blank "Other" is only an answer when the question allows it.
        allowBlankOther: true,
        choices: [
          { id: 'motion', label: 'Motion' },
          { id: 'director', label: 'Director' }
        ]
      }
    }
    const logic: Logic = {
      fieldId: 'role',
      branchByAnswer: true,
      payloads: [
        ['motion', 'motion-q'],
        ['director', 'end'],
        [OTHER_CHOICE_ID, 'other-q']
      ].map(([expected, fieldId]) => ({
        id: expected,
        condition: { comparison: ComparisonEnum.IS, expected },
        action: { kind: ActionEnum.NAVIGATE, fieldId }
      }))
    }
    const onSubmit = await mount(
      [role, question('motion-q', true), question('other-q', true), ending('end')],
      [logic]
    )

    await answer(JSON.stringify({ value: [], other }))
    await submit()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(currentQuestion()).toBe('other-q')

    await answer('Runs the budget')
    await submit()

    expect(onSubmit).toHaveBeenCalledWith(
      { role: { value: [], other }, 'other-q': 'Runs the budget' },
      false,
      undefined
    )
  }
)

test('progress counts only the questions on the route the answers chose', async () => {
  await mount(
    [question('q1'), question('skipped'), question('q3'), question('q4'), ending('end')],
    [navigate('q1', 'q3')]
  )

  await answer('yes')
  await submit()
  expect(currentQuestion()).toBe('q3')
  expect(currentPercentage()).toBe('33')

  await answer('done')
  await submit()
  expect(currentQuestion()).toBe('q4')
  expect(currentPercentage()).toBe('67')
})

test('progress drops answers left behind on a branch the respondent backed out of', async () => {
  await mount(
    [
      question('q1', false, 'q3'),
      question('branch-a'),
      question('branch-b', false, 'q3'),
      question('q3'),
      question('q4'),
      ending('end')
    ],
    [navigate('q1', 'branch-a')],
    { q1: 'yes', 'branch-a': 'a', 'branch-b': 'b' }
  )

  await answer('no')
  await submit()

  expect(currentQuestion()).toBe('q3')
  expect(currentPercentage()).toBe('33')
})

test('progress does not count a blank answer on a required question', async () => {
  await mount([question('q1'), question('q2', true), question('q3'), ending('end')], [], {
    q1: 'first',
    q2: ''
  })

  await submit()

  expect(currentQuestion()).toBe('q2')
  expect(currentPercentage()).toBe('33')
})

test('progress counts an optional question the respondent moved past', async () => {
  await mount([question('q1'), question('q2'), question('q3'), question('q4'), ending('end')], [])
  expect(currentPercentage()).toBe('0')

  await next()
  expect(currentQuestion()).toBe('q2')
  expect(currentPercentage()).toBe('25')

  await next()
  expect(currentQuestion()).toBe('q3')
  expect(currentPercentage()).toBe('50')

  // Going back to look at a question does not undo moving past it.
  await back()
  expect(currentQuestion()).toBe('q2')
  expect(currentPercentage()).toBe('50')
})

test('progress counts every optional question a jump moves past', async () => {
  await mount([question('q1'), question('q2'), question('q3'), question('q4'), ending('end')], [])

  await act(async () => {
    container.querySelector<HTMLButtonElement>('button[data-last]')!.click()
  })

  expect(currentQuestion()).toBe('q4')
  expect(currentPercentage()).toBe('75')
})

test('progress does not count a required question the respondent moved past', async () => {
  await mount([question('q1', true), question('q2'), ending('end')], [])

  await next()

  expect(currentQuestion()).toBe('q2')
  expect(currentPercentage()).toBe('0')
})

test('progress forgets questions skipped on a branch the respondent backed out of', async () => {
  await mount(
    [
      question('q1', false, 'q3'),
      question('branch-a', false, 'q3'),
      question('q3'),
      question('q4'),
      ending('end')
    ],
    [navigate('q1', 'branch-a')]
  )

  await answer('yes')
  await submit()
  expect(currentQuestion()).toBe('branch-a')

  await next()
  expect(currentQuestion()).toBe('q3')
  expect(currentPercentage()).toBe('50')

  await back()
  await back()
  await answer('no')
  await submit()

  expect(currentQuestion()).toBe('q3')
  expect(currentPercentage()).toBe('33')
})

test('progress counts declining optional legal terms as an answer', async () => {
  const terms: FormField = { id: 'terms', kind: FieldKindEnum.LEGAL_TERMS, title: 'terms' }

  await mount([terms, question('q2'), ending('end')], [], { terms: false })

  await submit()

  expect(currentQuestion()).toBe('q2')
  expect(currentPercentage()).toBe('50')
})

test('progress reaches 100% on a route through a group, which is not itself a question', async () => {
  const group: FormField = { id: 'group', kind: FieldKindEnum.GROUP, title: 'group' }
  const child = (id: string): FormField => ({ ...question(id), parent: group })

  await mount([group, child('c1'), child('c2'), question('q3'), ending('end')], [], {
    c1: 'a',
    c2: 'b',
    q3: 'c'
  })

  await submit()
  await submit()

  expect(currentQuestion()).toBe('c2')
  expect(currentPercentage()).toBe('100')
})

function upload(required: boolean): FormField {
  return { id: 'cv', kind: FieldKindEnum.FILE_UPLOAD, title: 'cv', validations: { required } }
}

// The renderer holds a chosen File as the answer; it is uploaded only after the route validates.
function chosenFile() {
  return new File(['cv'], 'cv.pdf', { type: 'application/pdf' })
}

test.each([
  ['an optional', false],
  ['a required', true]
])('a chosen file on %s upload question does not send submit back to it', async (_, required) => {
  const file = chosenFile()
  const onSubmit = await mount([upload(required), question('last'), ending('end')], [], {
    cv: file
  })

  await submit()
  expect(currentQuestion()).toBe('last')

  await answer('done')
  await submit()

  expect(onSubmit).toHaveBeenCalledWith({ cv: file, last: 'done' }, false, undefined)
  expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('end')
})

test('a chosen file on an upload question reached by a jump does not send submit back to it', async () => {
  const file = chosenFile()
  const onSubmit = await mount(
    [
      question('role', true),
      question('other-role'),
      upload(false),
      question('last'),
      ending('end')
    ],
    [navigate('role', 'cv', 'producer')],
    { role: 'producer', cv: file }
  )

  await submit()
  await submit()
  expect(currentQuestion()).toBe('last')

  await answer('done')
  await submit()

  expect(onSubmit).toHaveBeenCalledWith(
    { role: 'producer', cv: file, last: 'done' },
    false,
    undefined
  )
  expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('end')
})
