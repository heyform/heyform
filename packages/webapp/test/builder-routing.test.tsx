// @vitest-environment jsdom
import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  LogicPayload
} from '@heyform-inc/shared-types-enums'
import { act, useReducer } from 'react'
import { Root, createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { initFields } from '../src/pages/form/Builder/utils'
import { FormService } from '../src/services'

import i18n from '../src/i18n'
import { Builder as FormBuilder } from '../src/pages/form/Builder'
import LogicModal from '../src/pages/form/Builder/LogicModal'
import BuilderSync from '../src/pages/form/Builder/Sync'
import { IState, StoreContext, storeReducer } from '../src/pages/form/Builder/store'
import { useAppStore, useFormStore } from '../src/store'

// Only the API boundary is mocked; dialog, form controls, stores, reducer and save queue are real.
vi.mock('@/services', () => ({ FormService: { updateFormSchemas: vi.fn() } }))

let root: Root
let container: HTMLDivElement
const calculation: LogicPayload = {
  id: 'score-rule',
  condition: { comparison: ComparisonEnum.IS, expected: 'motion' },
  action: { kind: ActionEnum.CALCULATE, variable: 'score', operator: 'add', value: 1 }
} as LogicPayload

beforeEach(async () => {
  vi.useFakeTimers()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  useAppStore.setState({ modals: new Map() })
  useFormStore.setState({ form: { id: 'form', version: 1 } as any })
  vi.mocked(FormService.updateFormSchemas)
    .mockReset()
    .mockImplementation(async input => ({
      drafts: input.drafts,
      version: input.version + 1,
      canPublish: true
    }))
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function mount() {
  const initial: IState = {
    formId: 'form',
    locale: 'en',
    version: 0,
    references: [],
    hiddenFields: [],
    activeTabName: 'logic',
    variables: [{ id: 'score', name: 'Score', kind: 'number', value: 0 }],
    ...initFields(
      [
        {
          id: 'role',
          title: 'Role',
          kind: FieldKindEnum.MULTIPLE_CHOICE,
          properties: {
            choices: [
              { id: 'motion', label: 'Motion' },
              { id: 'producer', label: 'Producer' }
            ]
          }
        },
        { id: 'motion-q', title: 'Motion work', kind: FieldKindEnum.SHORT_TEXT },
        { id: 'producer-q', title: 'Producer work', kind: FieldKindEnum.SHORT_TEXT },
        { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU }
      ],
      [{ fieldId: 'role', payloads: [calculation] }]
    )
  }
  function Builder() {
    const [state, dispatch] = useReducer(storeReducer, initial)
    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        <BuilderSync />
        <button onClick={() => useAppStore.getState().openModal('LogicModal')}>Edit routing</button>
        <button
          onClick={() =>
            dispatch({ type: 'setNextField', payload: { fieldId: 'motion-q', nextFieldId: 'end' } })
          }
        >
          Connect Motion to ending
        </button>
        <button
          onClick={() => dispatch({ type: 'setNextField', payload: { fieldId: 'motion-q' } })}
        >
          Restore Motion form order
        </button>
        <LogicModal />
      </StoreContext.Provider>
    )
  }
  await act(async () =>
    root.render(
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    )
  )
}

async function click(text: string) {
  const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent === text)
  expect(button, `button "${text}" exists`).toBeTruthy()
  await act(async () => {
    if (button!.getAttribute('role') === 'tab') {
      button!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    } else {
      button!.click()
    }
  })
}

async function flushSave() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2_000)
  })
}

async function toggleBranching() {
  await act(async () => document.querySelector<HTMLButtonElement>('[role="switch"]')!.click())
}

async function choose(id: string, destination: string) {
  const select = document.querySelector<HTMLSelectElement>(
    `[data-name="destinations,${id}"] select`
  )!
  expect(select).toBeTruthy()
  await act(async () => {
    select.value = destination
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

test('enables, saves, reopens and disables answer branching without losing calculation rules', async () => {
  await mount()
  await click('Edit routing')
  await toggleBranching()
  await choose('motion', 'motion-q')
  await choose('producer', 'producer-q')
  await click('Save changes')
  await flushSave()

  const saved = vi.mocked(FormService.updateFormSchemas).mock.calls.at(-1)![0]
  expect(saved.drafts.find(f => f.id === 'role')!.validations.required).toBe(true)
  expect(saved.logics).toEqual([
    {
      fieldId: 'role',
      branchByAnswer: true,
      payloads: [
        {
          id: expect.any(String),
          condition: { comparison: 'is', expected: 'motion' },
          action: { kind: 'navigate', fieldId: 'motion-q' }
        },
        {
          id: expect.any(String),
          condition: { comparison: 'is', expected: 'producer' },
          action: { kind: 'navigate', fieldId: 'producer-q' }
        },
        calculation
      ]
    }
  ])

  await click('Edit routing')
  expect(document.querySelector('[role="switch"]')!.getAttribute('aria-checked')).toBe('true')
  expect(
    document.querySelector<HTMLSelectElement>('[data-name="destinations,motion"] select')!.value
  ).toBe('motion-q')
  expect(
    document.querySelector<HTMLSelectElement>('[data-name="destinations,producer"] select')!.value
  ).toBe('producer-q')
  await toggleBranching()
  await click('Save changes')
  await flushSave()
  const disabled = vi.mocked(FormService.updateFormSchemas).mock.calls.at(-1)![0]
  expect(disabled.logics![0].branchByAnswer).toBeUndefined()
  expect(disabled.logics![0].payloads).toEqual(saved.logics![0].payloads)
})

test('keeps autosave active in the production Logic Flow tab and persists its connection', async () => {
  Object.assign(window, {
    heyform: { device: { mobile: false }, enableGoogleFonts: false },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  const form = {
    id: 'form',
    name: 'Routing test',
    version: 1,
    settings: { locale: 'en' },
    themeSettings: {},
    drafts: [
      { id: 'a', title: ['First'], kind: FieldKindEnum.SHORT_TEXT },
      { id: 'b', title: ['Second'], kind: FieldKindEnum.SHORT_TEXT },
      { id: 'end', title: ['Thanks'], kind: FieldKindEnum.THANK_YOU }
    ],
    logics: []
  }
  useFormStore.getState().setForm(form as any)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <FormBuilder form={form as any} />
      </MemoryRouter>
    )
  )
  await click('Logic')
  expect(document.querySelector('.logic-flow')).toBeTruthy()
  await act(async () =>
    document.querySelector<HTMLElement>('.react-flow__node[data-id="a"]')!.click()
  )
  const destination = document.querySelector<HTMLSelectElement>('[data-name="nextFieldId"] select')!
  expect(destination).toBeTruthy()
  await act(async () => {
    destination.value = 'end'
    destination.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await click('Save changes')
  await flushSave()
  expect(
    vi
      .mocked(FormService.updateFormSchemas)
      .mock.calls.at(-1)![0]
      .drafts.find(f => f.id === 'a')!.nextFieldId
  ).toBe('end')
  await click('Question')
  expect(document.querySelector('.logic-flow')).toBeNull()
})

test('finishes pending routing edits after leaving the builder, using the saved version', async () => {
  let finishFirstSave!: (value: any) => void
  vi.mocked(FormService.updateFormSchemas).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishFirstSave = resolve
      })
  )
  await mount()
  await click('Connect Motion to ending')
  expect(FormService.updateFormSchemas).toHaveBeenCalledTimes(1)
  expect(
    vi.mocked(FormService.updateFormSchemas).mock.calls[0][0].drafts.find(f => f.id === 'motion-q')!
      .nextFieldId
  ).toBe('end')
  await click('Restore Motion form order')
  await act(async () => root.render(null))
  useFormStore.setState({ form: { id: 'another-form', version: 99 } as any })
  await act(async () => finishFirstSave({ version: 2, canPublish: true }))

  expect(FormService.updateFormSchemas).toHaveBeenCalledTimes(2)
  const finalSave = vi.mocked(FormService.updateFormSchemas).mock.calls[1][0]
  expect(useFormStore.getState().form!.id).toBe('another-form')
  expect(useFormStore.getState().form!.version).toBe(99)
  expect(finalSave.version).toBe(2)
  expect(finalSave.drafts.find(f => f.id === 'motion-q')!.nextFieldId).toBeUndefined()
})

test.each([1, 3])(
  'uses the latest version when the same form is reopened at version %i during a save',
  async reopenedVersion => {
    let finishFirstSave!: (value: any) => void
    vi.mocked(FormService.updateFormSchemas).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishFirstSave = resolve
        })
    )
    await mount()
    await click('Connect Motion to ending')
    await act(async () => root.render(null))
    await mount()
    await act(async () =>
      useFormStore.setState({ form: { id: 'form', version: reopenedVersion } as any })
    )
    await act(async () => finishFirstSave({ version: 2, canPublish: true }))
    expect(useFormStore.getState().form!.version).toBe(Math.max(2, reopenedVersion))
    await click('Connect Motion to ending')

    expect(FormService.updateFormSchemas).toHaveBeenCalledTimes(2)
    expect(vi.mocked(FormService.updateFormSchemas).mock.calls[1][0].version).toBe(
      Math.max(2, reopenedVersion)
    )
  }
)
