// @vitest-environment jsdom
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import i18n from '../src/i18n'
import { DiscardingEndingIcon } from '../src/pages/form/Builder/LeftSidebar/QuestionList'
import ThankYou from '../src/pages/form/Builder/RightSidebar/Question/ThankYou'
import { StoreContext } from '../src/pages/form/Builder/store/context'

let root: Root
let container: HTMLDivElement

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

const question = { id: 'q1', kind: FieldKindEnum.SHORT_TEXT, title: 'q1' }
const first = { id: 'first', kind: FieldKindEnum.THANK_YOU, title: 'first' }
const second = { id: 'second', kind: FieldKindEnum.THANK_YOU, title: 'second' }
const on = { properties: { discardSubmission: true } }

async function mount(field: any) {
  const dispatch = vi.fn()

  await act(async () =>
    root.render(
      <StoreContext.Provider
        value={{ state: { fields: [question, first, second] } as any, dispatch }}
      >
        <ThankYou field={field} />
      </StoreContext.Provider>
    )
  )

  return dispatch
}

const firstEndingWarning = () =>
  container.textContent?.includes(i18n.t('form.builder.settings.discardSubmissionFirstEnding'))

test('the switch saves the setting without dropping other properties', async () => {
  const dispatch = await mount({ ...second, properties: { buttonText: 'Done' } })

  await act(async () => container.querySelector<HTMLElement>('[role="switch"]')!.click())

  expect(dispatch).toHaveBeenCalledWith({
    type: 'updateField',
    payload: {
      id: 'second',
      updates: { properties: { buttonText: 'Done', discardSubmission: true } }
    }
  })
})

test('turning it on for the first ending warns about routes that fall through', async () => {
  await mount({ ...first, ...on })

  expect(firstEndingWarning()).toBe(true)
})

test('there is no warning on a later ending, or while the switch is off', async () => {
  await mount({ ...second, ...on })
  expect(firstEndingWarning()).toBe(false)

  await mount(first)
  expect(firstEndingWarning()).toBe(false)
})

test('only an ending with the switch on gets the icon', async () => {
  await act(async () => root.render(<DiscardingEndingIcon field={{ ...second, ...on } as any} />))
  expect(container.querySelector('svg')).not.toBeNull()

  await act(async () => root.render(<DiscardingEndingIcon field={second as any} />))
  expect(container.querySelector('svg')).toBeNull()

  await act(async () => root.render(<DiscardingEndingIcon field={{ ...question, ...on } as any} />))
  expect(container.querySelector('svg')).toBeNull()
})
