// @vitest-environment jsdom
// The renderer against the server, over every answer map. Replaces FormFlow.tla's
// Client_MatchesServer / Termination and Discard.tla's NoDataLoss, EndingsAgree,
// ClientDiscardIsServerDiscard and ShownIsResolved (MCFlow, MCTerm, MCDiscard*): both sides
// run their real code, the renderer through its store reducer and getRespondentFields().
import { FieldKindEnum, type FormField } from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import {
  DiscardForm,
  DiscardGroupForm,
  DiscardGroupValues,
  DiscardValues,
  DiscardVariableForm,
  FlowForm,
  FlowValues,
  type TestForm,
  answerMaps
} from '../../answer-utils/test/form-flow/fixtures'
import { getEndingRouteFields, getRespondentFields } from '../src/utils'
import {
  applyLogicToFields,
  flattenFields,
  isSubmissionDiscarded,
  resolveEnding
} from '@heyform-inc/answer-utils'
import { clone } from '@heyform-inc/utils'

import { type IState, StoreReducer } from '../src/store'

// initStore() without storage, theme or translations
function initialState(form: TestForm, allowPayment = true): IState {
  const { welcomeField, thankYouFields, allFields } = getRespondentFields(
    clone(form.fields),
    {},
    allowPayment
  )
  const jumpFieldIds = form.logics.map(l => l.fieldId)
  const { fields, variables } = applyLogicToFields(
    [...allFields, ...thankYouFields],
    form.logics,
    form.variables,
    {}
  )

  return {
    instanceId: 'test',
    formId: 'form',
    welcomeField,
    thankYouFields,
    allFields,
    fields,
    hiddenFields: [],
    jumpFieldIds,
    logics: form.logics,
    parameters: form.variables,
    variables,
    values: {},
    scrollIndex: 0,
    query: {},
    locale: 'en',
    theme: {},
    questionCount: 0,
    percentage: 0,
    passedFieldIds: []
  } as IState
}

// A respondent answering each question on screen with its value from `values`, then moving
// on, until the form won't go further. Returns the screens they saw.
function clientWalk(form: TestForm, values: Record<string, unknown>) {
  let state = initialState(form)
  const seen: string[] = []

  for (let step = 0; step <= state.allFields.length + 1; step++) {
    const field = state.fields[state.scrollIndex!]
    seen.push(field.id)

    if (field.kind !== FieldKindEnum.GROUP && field.kind !== FieldKindEnum.STATEMENT) {
      state = StoreReducer(state, {
        type: 'setValues',
        payload: { values: { [field.id]: values[field.id] } }
      })
    }

    const index = state.scrollIndex
    state = StoreReducer(state, { type: 'scrollNext' })

    if (state.scrollIndex === index) {
      return { seen, finished: index === state.fields.length - 1 }
    }
  }

  throw new Error(`the walk did not terminate: ${seen}`)
}

// completeSubmission's route: applyLogicToFields over flattenFields(form.fields, true)
function serverRoute(form: TestForm, values: Record<string, unknown>) {
  const flattened = flattenFields(clone(form.fields), true)
  return applyLogicToFields(flattened, form.logics, form.variables, values as any)
    .fields.map(f => f.id)
    .filter(id => flattened.find(f => f.id === id)?.kind !== FieldKindEnum.WELCOME)
}

test('the screens a respondent walks through are the route the server replays', () => {
  const routes = new Set<string>()
  let walks = 0
  let finished = 0

  for (const values of answerMaps(FlowValues)) {
    const walk = clientWalk(FlowForm, values)
    const route = serverRoute(FlowForm, values)

    walks++
    routes.add(route.join())
    // A walk the form stops early (a required question left blank) is a prefix of the route
    expect(route.slice(0, walk.seen.length), JSON.stringify(values)).toEqual(walk.seen)

    if (walk.finished) {
      finished++
      expect(walk.seen, JSON.stringify(values)).toEqual(route)
    }
  }

  expect(walks).toBe(6 * 5 * 7 * 6 * 7)
  // Not vacuous: plenty of walks reach the end, over every route the jumps can make
  expect(finished).toBeGreaterThan(1000)
  expect([...routes].sort()).toEqual([
    'q2,q3,q4,q5,q6', // q3 = "n", q4 not over 5, q5 without c2
    'q2,q3,q4,q6', // q4 > 5 jumps to q6
    'q2,q3,q5,q6', // q3 = "y"
    'q2,q5,q6' // q2 = "skip"
  ])
})

type ListBuilder = (allFields: FormField[], thankYouFields: FormField[]) => FormField[]

// Everything the renderer and the server must agree on for one answer map
function endingProblems(
  form: TestForm,
  values: Record<string, unknown>,
  build: ListBuilder = getEndingRouteFields
): string[] {
  const problems: string[] = []
  const hasVariableRules = form.variables.some(v => v.logics?.length)
  const flattened = flattenFields(clone(form.fields), true)

  for (const partial of [false, true]) {
    const serverDiscards = isSubmissionDiscarded(form, flattened, values, partial)

    for (const allowPayment of [true, false]) {
      const { allFields, thankYouFields } = getRespondentFields(
        clone(form.fields),
        {},
        allowPayment
      )
      const ending = resolveEnding(
        build(allFields, thankYouFields),
        form.logics,
        form.variables,
        values as any,
        partial
      )
      const clientDiscards = ending?.properties?.discardSubmission === true
      const at = `${JSON.stringify(values)} partial=${partial} payment=${allowPayment}`

      // NoDataLoss: the server never drops a response the renderer showed as saved
      if (serverDiscards && !clientDiscards) problems.push(`server discards a saved response ${at}`)

      // ClientDiscardIsServerDiscard: with payments on (the server's full projection) and no
      // variable rules, the renderer only drops what the server would drop too
      if (allowPayment && !hasVariableRules && clientDiscards && !serverDiscards) {
        problems.push(`renderer discards a response the server would keep ${at}`)
      }

      // ShownIsResolved: Form.tsx and Header.tsx pass ending.id, and Blocks.tsx can only show
      // the top-level endings
      if (ending && !thankYouFields.some(f => f.id === ending.id)) {
        problems.push(`resolved ending ${ending.id} cannot be shown ${at}`)
      }
    }
  }

  return problems
}

test.each([
  ['an ending nested in a group and a payment question', DiscardForm, DiscardValues],
  ['variable rules', DiscardVariableForm, DiscardValues],
  ['an empty group on the route', DiscardGroupForm, DiscardGroupValues]
])('the renderer and the server agree on discarding (%s)', (_, form, values) => {
  const problems = [...answerMaps(values)].flatMap(v => endingProblems(form, v))

  expect(problems).toEqual([])
})

test('the agreement check catches the list the renderer used before the fix', () => {
  // #387 passed [...allFields, ...thankYouFields]: an ending nested in a group came first and
  // became the fallback ending
  const legacy: ListBuilder = (allFields, thankYouFields) => [...allFields, ...thankYouFields]
  const problems = [...answerMaps(DiscardValues)].flatMap(v =>
    endingProblems(DiscardForm, v, legacy)
  )

  expect(problems).toContain(
    'renderer discards a response the server would keep {"q1":"yes"} partial=false payment=true'
  )
  expect(problems.some(p => p.startsWith('resolved ending nested cannot be shown'))).toBe(true)
})
