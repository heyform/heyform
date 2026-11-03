// @vitest-environment jsdom
import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  type FormField,
  type Logic
} from '@heyform-inc/shared-types-enums'
import { act, useReducer } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { applyLogicToFields } from '@heyform-inc/answer-utils'

import { initI18n } from '../src/i18n'
import { type IState, StoreContext, StoreReducer } from '../src/store'
import { Header } from '../src/views/Header'

vi.mock('../src/components/Countdown', () => ({
  Countdown: ({ onEnd }: { onEnd: () => void }) => (
    <button data-expire onClick={onEnd}>
      Time is up
    </button>
  )
}))

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

const question: FormField = {
  id: 'q1',
  kind: FieldKindEnum.SHORT_TEXT,
  title: 'q1',
  validations: {}
}

function ending(id: string, discardSubmission?: boolean): FormField {
  return { id, kind: FieldKindEnum.THANK_YOU, title: id, properties: { discardSubmission } }
}

const logics: Logic[] = [
  {
    fieldId: 'q1',
    payloads: [
      {
        id: 'p1',
        condition: { comparison: ComparisonEnum.IS, expected: 'yes' },
        action: { kind: ActionEnum.NAVIGATE, fieldId: 'saved' }
      }
    ]
  }
]

async function expire(fields: FormField[], query: Record<string, any> = {}) {
  const onSubmit = vi.fn(async () => {})
  const thankYouFields = fields.filter(field => field.kind === FieldKindEnum.THANK_YOU)
  const initialState: IState = {
    instanceId: 'test',
    formId: 'countdown-test',
    allFields: fields.filter(field => field.kind !== FieldKindEnum.THANK_YOU),
    thankYouFields,
    hiddenFields: [],
    jumpFieldIds: ['q1'],
    logics,
    values: {},
    ...applyLogicToFields(fields, logics, [], {}),
    scrollIndex: 0,
    query,
    locale: 'en',
    theme: {},
    questionCount: 0,
    percentage: 0,
    settings: { enableTimeLimit: true, timeLimit: 60 },
    onSubmit
  }

  function Respondent() {
    const [state, dispatch] = useReducer(StoreReducer, initialState)

    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        {state.isSubmitted ? <output data-ending={state.thankYouFieldId ?? 'none'} /> : <Header />}
      </StoreContext.Provider>
    )
  }

  await act(async () => root.render(<Respondent />))
  await act(async () => container.querySelector<HTMLButtonElement>('[data-expire]')!.click())

  return onSubmit
}

test('running out of time on a discarding route shows the ending without submitting', async () => {
  const onSubmit = await expire([question, ending('later', true), ending('saved')])

  expect(onSubmit).not.toHaveBeenCalled()
  expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('later')
})

test('running out of time on any other route still sends what was answered', async () => {
  const onSubmit = await expire([question, ending('saved'), ending('later', true)])

  expect(onSubmit).toHaveBeenCalledWith({}, true)
  expect(container.querySelector('output')?.getAttribute('data-ending')).toBe('none')
})

test('running out of time on a discarding route keeps the embed open', async () => {
  const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})

  await expire([question, ending('later', true), ending('saved')], { hideAfterSubmit: true })

  expect(postMessage).not.toHaveBeenCalled()
  postMessage.mockRestore()
})
