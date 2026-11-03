// Forms for the exhaustive form-flow tests. They replace the TLA+ model in specs/form-flow:
// instead of modelling the code, every test runs the real functions over every answer map
// built from the value lists below.
import {
  ActionEnum,
  CalculateEnum,
  ComparisonEnum,
  FieldKindEnum,
  type FormField,
  type Logic,
  type Variable
} from '@heyform-inc/shared-types-enums'

import { calculateAction } from '../../src/calculate-action'
import { getChoiceBranchingErrors } from '../../src/choice-branching'
import { flattenFields } from '../../src/flatten-fields'
import { createFieldNavigation } from '../../src/navigation'
import { validateCondition } from '../../src/validate-condition'

export interface TestForm {
  fields: FormField[]
  logics: Logic[]
  variables: Variable[]
}

export function question(
  id: string,
  kind: FieldKindEnum,
  { required = false, ...properties }: Record<string, any> = {}
): FormField {
  return { id, title: id, kind, validations: { required }, properties } as FormField
}

export function ending(id: string, properties: Record<string, any> = {}): FormField {
  return { id, title: id, kind: FieldKindEnum.THANK_YOU, properties } as FormField
}

export function nav(comparison: ComparisonEnum, expected: unknown, fieldId: string) {
  return {
    id: `nav-${fieldId}-${String(expected)}`,
    condition: { comparison, expected },
    action: { kind: ActionEnum.NAVIGATE, fieldId }
  } as any
}

export function calc(
  comparison: ComparisonEnum,
  expected: unknown,
  variable: string,
  operator: CalculateEnum,
  ref: string
) {
  return {
    id: `calc-${variable}-${ref}`,
    condition: { comparison, expected },
    action: { kind: ActionEnum.CALCULATE, variable, operator, ref }
  } as any
}

const choices = (...ids: string[]) => ids.map(id => ({ id, label: id.toUpperCase() }))

// A welcome screen, a text jump, a yes/no branching by answer, an optional number with a
// calculate rule and a numeric jump, a multiple choice with "Other" and a "contains" jump,
// a rating and an ending.
export const FlowForm: TestForm = {
  fields: [
    { id: 'w1', title: 'w1', kind: FieldKindEnum.WELCOME } as FormField,
    question('q2', FieldKindEnum.SHORT_TEXT, { required: true }),
    question('q3', FieldKindEnum.YES_NO, { required: true, choices: choices('y', 'n') }),
    { ...question('q4', FieldKindEnum.NUMBER), nextFieldId: 'q5' },
    question('q5', FieldKindEnum.MULTIPLE_CHOICE, {
      required: true,
      choices: choices('c1', 'c2'),
      allowMultiple: true,
      allowOther: true,
      allowBlankOther: true
    }),
    question('q6', FieldKindEnum.RATING, { required: true, total: 5 }),
    ending('t7')
  ],
  logics: [
    { fieldId: 'q2', payloads: [nav(ComparisonEnum.IS, 'skip', 'q5')] },
    {
      fieldId: 'q3',
      branchByAnswer: true,
      payloads: [nav(ComparisonEnum.IS, 'y', 'q5'), nav(ComparisonEnum.IS, 'n', 'q4')]
    },
    {
      fieldId: 'q4',
      payloads: [
        calc(ComparisonEnum.GREATER_OR_EQUAL_THAN, 0, 'total', CalculateEnum.ADDITION, 'q4'),
        nav(ComparisonEnum.GREATER_THAN, 5, 'q6')
      ]
    },
    { fieldId: 'q5', payloads: [nav(ComparisonEnum.CONTAINS, 'c2', 'q6')] }
  ],
  variables: [{ id: 'total', name: 'total', kind: 'number', value: 0, logics: [] }]
}

// What the respondent (or anyone with the endpoint) may send for each FlowForm question:
// the answers the field wants, plus shapes it doesn't.
export const FlowValues: Record<string, unknown[]> = {
  q2: [undefined, '', 'a', 'skip', 3, { value: ['c1'] }],
  q3: [undefined, 'y', 'n', 'x', ['y']],
  q4: [undefined, '', 3, 7, '12', '3abc', [3]],
  q5: [
    undefined,
    { value: ['c1'] },
    { value: ['c1', 'c2'], other: 'x' },
    { value: [], other: '' },
    { value: ['zz'] },
    'c2'
  ],
  q6: [undefined, 1, 5, 6, '3', '3abc', 3.5]
}

// Every value a hostile client may send for any field: scalars, near-misses and nested
// shapes. Used where questions don't depend on each other.
export const AnyValues: unknown[] = [
  undefined,
  null,
  '',
  ' ',
  'a',
  '12',
  '3abc',
  '0x3',
  '2024-01-01',
  'https://example.com/a.png',
  0,
  3,
  7,
  -1,
  3.5,
  true,
  false,
  [],
  [3],
  ['y'],
  [{ col1: 'x' }],
  [{ col1: { a: 1 } }],
  {},
  { a: 1 },
  { value: ['c1'] },
  { value: [], other: { a: 1 } },
  { start: '2024-01-01', end: '2024-02-01' },
  { start: '2024-02-01', end: '2024-01-01' },
  { start: null },
  { firstName: 'a', lastName: 'b' },
  { firstName: { a: 1 }, lastName: 'b' },
  { address1: 'a', city: 'c', state: 's', zip: 'z', country: 'US' },
  { address1: { a: 1 }, city: 'c', state: 's', zip: 'z', country: 'US' }
]

// Every kind whose stored value the submissions table inspects, all optional so a client can
// leave them blank, plus the text-like kinds.
export const AttackForm: TestForm = {
  fields: [
    question('short_text', FieldKindEnum.SHORT_TEXT),
    question('number', FieldKindEnum.NUMBER),
    question('rating', FieldKindEnum.RATING, { total: 5 }),
    question('opinion_scale', FieldKindEnum.OPINION_SCALE, { total: 10 }),
    question('yes_no', FieldKindEnum.YES_NO, { choices: choices('y', 'n') }),
    question('multiple_choice', FieldKindEnum.MULTIPLE_CHOICE, {
      choices: choices('c1', 'c2'),
      allowOther: true,
      allowMultiple: true
    }),
    question('date', FieldKindEnum.DATE, { format: 'YYYY-MM-DD' }),
    question('date_range', FieldKindEnum.DATE_RANGE, { format: 'YYYY-MM-DD' }),
    question('full_name', FieldKindEnum.FULL_NAME),
    question('address', FieldKindEnum.ADDRESS),
    question('input_table', FieldKindEnum.INPUT_TABLE, {
      tableColumns: [{ id: 'col1', label: 'Col 1' }]
    }),
    question('legal_terms', FieldKindEnum.LEGAL_TERMS),
    question('email', FieldKindEnum.EMAIL),
    question('url', FieldKindEnum.URL),
    question('phone_number', FieldKindEnum.PHONE_NUMBER),
    ending('end')
  ],
  logics: [],
  variables: []
}

// The JS types each kind may store. An unanswered optional question is stored as '' whatever
// its kind (an open issue: the table guards every such shape).
export const StoredTypes: Partial<Record<FieldKindEnum, string[]>> = {
  [FieldKindEnum.NUMBER]: ['number', 'string'],
  [FieldKindEnum.RATING]: ['number', 'string'],
  [FieldKindEnum.OPINION_SCALE]: ['number', 'string'],
  [FieldKindEnum.MULTIPLE_CHOICE]: ['object'],
  [FieldKindEnum.PICTURE_CHOICE]: ['object'],
  [FieldKindEnum.FILE_UPLOAD]: ['string', 'object'],
  [FieldKindEnum.LEGAL_TERMS]: ['boolean', 'string'],
  [FieldKindEnum.DATE_RANGE]: ['object', 'string'],
  [FieldKindEnum.FULL_NAME]: ['object', 'string'],
  [FieldKindEnum.ADDRESS]: ['object', 'string'],
  [FieldKindEnum.PAYMENT]: ['object'],
  [FieldKindEnum.INPUT_TABLE]: ['array', 'string']
}

export const typeOf = (value: unknown) =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

// Every combination of the given values, one map per combination
export function* answerMaps(values: Record<string, unknown[]>): Generator<Record<string, unknown>> {
  const ids = Object.keys(values)

  function* walk(i: number, acc: Record<string, unknown>): Generator<Record<string, unknown>> {
    if (i === ids.length) {
      yield { ...acc }
      return
    }

    for (const value of values[ids[i]]) {
      acc[ids[i]] = value
      yield* walk(i + 1, acc)
    }
  }

  yield* walk(0, {})
}

// The FlowForm with two configuration bugs: q2 jumps to a field that does not exist, and q3
// compares a yes/no answer with "contains", which can never hold.
export const BrokenForm: TestForm = {
  ...FlowForm,
  logics: FlowForm.logics.map(logic =>
    logic.fieldId === 'q2'
      ? { ...logic, payloads: [nav(ComparisonEnum.IS, 'skip', 'q9')] }
      : logic.fieldId === 'q3'
        ? { ...logic, branchByAnswer: false, payloads: [nav(ComparisonEnum.CONTAINS, 'y', 'q5')] }
        : logic
  )
}

// What is wrong with a form's logic, judged by the real navigation and condition code: jumps
// that don't move forward, rules no answer can fire, calculate rules that never change their
// variable, and branching questions that don't cover every answer.
export function logicProblems(form: TestForm, values: Record<string, unknown[]> = {}): string[] {
  const fields = flattenFields(form.fields, true)
  const navigation = createFieldNavigation(fields)
  const byId = new Map(fields.map(f => [f.id, f]))
  const problems: string[] = []

  for (const field of fields) {
    if (field.nextFieldId && !navigation.isValidNextFieldId(field.id, field.nextFieldId)) {
      problems.push(`${field.id}: next question ${field.nextFieldId} is not ahead of it`)
    }
  }

  for (const logic of form.logics) {
    const field = byId.get(logic.fieldId)
    if (!field) {
      problems.push(`logic on missing field ${logic.fieldId}`)
      continue
    }

    const candidates = [...(values[field.id] ?? []), ...AnyValues]

    for (const payload of logic.payloads) {
      // Config_NextTargets
      if (
        payload.action.kind === ActionEnum.NAVIGATE &&
        !navigation.isValidNextFieldId(field.id, payload.action.fieldId)
      ) {
        problems.push(`${field.id}: jump to ${payload.action.fieldId} is not ahead of it`)
      }

      // Config_RulesReachable: some answer makes the rule fire
      const fires = candidates.filter(v =>
        validateCondition(field, payload.condition, { [field.id]: v } as any)
      )
      if (fires.length < 1) problems.push(`${field.id}: rule ${payload.id} can never fire`)

      // Config_CalcTyped: some answer that fires it changes the variable
      if (payload.action.kind === ActionEnum.CALCULATE) {
        const action = payload.action
        const start = Object.fromEntries(form.variables.map(v => [v.id, v.value]))
        const changes = fires.some(v => {
          const next = calculateAction(action, form.variables, start, { [field.id]: v } as any)
          return next[action.variable] !== start[action.variable]
        })
        if (!changes)
          problems.push(`${field.id}: rule ${payload.id} never changes ${action.variable}`)
      }
    }
  }

  // Config_BranchCoverage
  for (const error of getChoiceBranchingErrors(fields, form.logics)) {
    problems.push(`${error.fieldId}: ${error.type}`)
  }

  return problems
}

// ---------------------------------------------------------------------------
// Endings that keep their responses out of the form (#387)
// ---------------------------------------------------------------------------
const payment = (id: string) =>
  question(id, FieldKindEnum.PAYMENT, { price: { type: 'number', value: 10 }, currency: 'usd' })

// q1 --"no"--> later (discards); pay is a payment question; q2 --"x"--> nested, an ending
// inside a group (only reachable through stored data, and never shown); ok saves.
export const DiscardForm: TestForm = {
  fields: [
    question('q1', FieldKindEnum.SHORT_TEXT, { required: true }),
    payment('pay'),
    question('q2', FieldKindEnum.SHORT_TEXT),
    ending('ok'),
    ending('later', { discardSubmission: true }),
    {
      id: 'g',
      title: 'g',
      kind: FieldKindEnum.GROUP,
      properties: { fields: [ending('nested', { discardSubmission: true })] }
    } as FormField
  ],
  logics: [
    { fieldId: 'q1', payloads: [nav(ComparisonEnum.IS, 'no', 'later')] },
    { fieldId: 'q2', payloads: [nav(ComparisonEnum.IS, 'x', 'nested')] }
  ],
  variables: []
}

export const DiscardValues: Record<string, unknown[]> = {
  q1: [undefined, '', 'no', 'x', 'yes'],
  pay: [undefined, { amount: 1000, currency: 'usd', billingDetails: { name: 'a' } }],
  q2: [undefined, '', 'no', 'x']
}

// The same form with a variable rule: the server leaves these forms to the renderer
export const DiscardVariableForm: TestForm = {
  ...DiscardForm,
  variables: [
    {
      id: 'score',
      name: 'score',
      kind: 'number',
      value: 0,
      logics: [nav(ComparisonEnum.GREATER_THAN, 5, 'later')]
    }
  ]
}

// An empty group on the route: q1 points at it and the renderer, which drops it, goes on to
// q2 and its saving ending. The server must not follow the group on to "later".
export const DiscardGroupForm: TestForm = {
  fields: [
    { ...question('q1', FieldKindEnum.SHORT_TEXT), nextFieldId: 'empty' },
    { ...question('q2', FieldKindEnum.SHORT_TEXT), nextFieldId: 'ok' },
    {
      id: 'empty',
      title: 'empty',
      kind: FieldKindEnum.GROUP,
      properties: { fields: [] }
    } as FormField,
    ending('later', { discardSubmission: true }),
    ending('ok')
  ],
  logics: [],
  variables: []
}

export const DiscardGroupValues: Record<string, unknown[]> = {
  q1: [undefined, '', 'no', 'yes'],
  q2: [undefined, '', 'yes']
}
