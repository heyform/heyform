// @vitest-environment jsdom
// After a question's kind changes, existing submissions keep the kind they were stored with.
// Replaces FormFlow.tla's Drift_* invariants (MCDrift, MCDriftUnguarded, MCDriftLogic,
// MCDriftCalc) with the real builder action and the real submissions table.
import {
  ActionEnum,
  CalculateEnum,
  ComparisonEnum,
  FieldKindEnum
} from '@heyform-inc/shared-types-enums'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, expect, test } from 'vitest'

import {
  type TestForm,
  calc,
  ending,
  logicProblems,
  nav,
  question
} from '../../answer-utils/test/form-flow/fixtures'
import { getPropertiesFromKind } from '../src/pages/form/Builder/utils'

import i18n from '../src/i18n'
import { updateField } from '../src/pages/form/Builder/store/actions'
import SubmissionCell from '../src/pages/form/Submissions/SubmissionCell'

beforeAll(async () => {
  await i18n.changeLanguage('en')
  ;(window as any).heyform = { uploadOrigins: ['https://example.com'] }
})

const choices = [
  { id: 'c1', label: 'One' },
  { id: 'c2', label: 'Two' }
]

// A stored value of each kind, and the properties its field needs to show it
const SAMPLES: Partial<Record<FieldKindEnum, { value: unknown; properties?: any }>> = {
  [FieldKindEnum.SHORT_TEXT]: { value: 'abc' },
  [FieldKindEnum.LONG_TEXT]: { value: 'abc' },
  [FieldKindEnum.NUMBER]: { value: 3 },
  [FieldKindEnum.EMAIL]: { value: 'a@example.com' },
  [FieldKindEnum.URL]: { value: 'https://example.com' },
  [FieldKindEnum.PHONE_NUMBER]: { value: '+14155552671' },
  [FieldKindEnum.COUNTRY]: { value: 'US' },
  [FieldKindEnum.DATE]: { value: '2024-01-01' },
  [FieldKindEnum.YES_NO]: {
    value: 'y',
    properties: {
      choices: [
        { id: 'y', label: 'Yes' },
        { id: 'n', label: 'No' }
      ]
    }
  },
  [FieldKindEnum.MULTIPLE_CHOICE]: { value: { value: ['c1'] }, properties: { choices } },
  [FieldKindEnum.PICTURE_CHOICE]: { value: { value: ['c1'] }, properties: { choices } },
  [FieldKindEnum.RATING]: { value: 3, properties: { total: 5 } },
  [FieldKindEnum.OPINION_SCALE]: { value: 3, properties: { total: 10 } },
  [FieldKindEnum.DATE_RANGE]: { value: { start: '2024-01-01', end: '2024-02-01' } },
  [FieldKindEnum.FULL_NAME]: { value: { firstName: 'Ada', lastName: 'Lovelace' } },
  [FieldKindEnum.ADDRESS]: {
    value: { address1: '1 Main St', city: 'C', state: 'S', zip: 'Z', country: 'US' }
  },
  [FieldKindEnum.INPUT_TABLE]: {
    value: [{ col1: 'x' }],
    properties: { tableColumns: [{ id: 'col1', label: 'Col 1' }] }
  },
  [FieldKindEnum.FILE_UPLOAD]: { value: 'https://example.com/report.pdf' },
  [FieldKindEnum.SIGNATURE]: { value: 'https://example.com/signature.png' },
  [FieldKindEnum.LEGAL_TERMS]: { value: true },
  [FieldKindEnum.PAYMENT]: { value: { amount: 500, currency: 'usd' } }
}

const KINDS = Object.keys(SAMPLES) as FieldKindEnum[]

function cell(fieldKind: FieldKindEnum, answerKind: FieldKindEnum, isTableCell: boolean) {
  // The field keeps the properties of both kinds, like a type switch does
  const field = {
    id: 'f',
    title: 'f',
    kind: fieldKind,
    properties: { ...SAMPLES[answerKind]!.properties, ...SAMPLES[fieldKind]!.properties }
  }
  const answer = { id: 'f', title: 'f', kind: answerKind, value: SAMPLES[answerKind]!.value }

  return renderToStaticMarkup(
    <SubmissionCell
      field={field as any}
      submission={{ id: 's', answers: [answer] } as any}
      answer={answer as any}
      isTableCell={isTableCell}
    />
  )
}

test('an answer whose kind no longer matches its question renders an empty cell', () => {
  const shown: string[] = []

  for (const fieldKind of KINDS) {
    for (const answerKind of KINDS) {
      for (const isTableCell of [true, false]) {
        const html = cell(fieldKind, answerKind, isTableCell)

        if (fieldKind === answerKind && html === '') shown.push(`${fieldKind} hides its own answer`)
        if (fieldKind !== answerKind && html !== '') {
          shown.push(`${answerKind} answer shown as ${fieldKind}: ${html.slice(0, 60)}`)
        }
      }
    }
  }

  expect(shown).toEqual([])
})

// d1 short_text --"skip"--> d3; d2 yes/no branching: y -> d3, n -> end; d3 number,
// total += d3, and --"> 5"--> end
const DriftForm: TestForm = {
  fields: [
    question('d1', FieldKindEnum.SHORT_TEXT, { required: true }),
    question('d2', FieldKindEnum.YES_NO, {
      required: true,
      choices: [
        { id: 'y', label: 'Yes' },
        { id: 'n', label: 'No' }
      ]
    }),
    question('d3', FieldKindEnum.NUMBER, { required: true }),
    ending('end')
  ],
  logics: [
    { fieldId: 'd1', payloads: [nav(ComparisonEnum.IS, 'skip', 'd3')] },
    {
      fieldId: 'd2',
      branchByAnswer: true,
      payloads: [nav(ComparisonEnum.IS, 'y', 'd3'), nav(ComparisonEnum.IS, 'n', 'end')]
    },
    {
      fieldId: 'd3',
      payloads: [
        calc(ComparisonEnum.GREATER_OR_EQUAL_THAN, 0, 'total', CalculateEnum.ADDITION, 'd3'),
        nav(ComparisonEnum.GREATER_THAN, 5, 'end')
      ]
    }
  ],
  variables: [{ id: 'total', name: 'total', kind: 'number', value: 0, logics: [] }]
}
const DriftValues = { d1: ['skip', 'y'], d2: ['y', 'n'], d3: [3, 7] }

// What TypeSwitcher dispatches: the new kind plus getPropertiesFromKind()
function switchKind(form: TestForm, id: string, kind: FieldKindEnum): TestForm {
  const state = { fields: form.fields, logics: form.logics, questions: [], currentId: id } as any
  const field = form.fields.find(f => f.id === id)!
  const next = updateField(state, {
    id,
    updates: { kind, properties: getPropertiesFromKind(field.properties!, kind) }
  })

  return { fields: next.fields, logics: next.logics ?? form.logics, variables: form.variables }
}

test('the drift form starts out with no logic problem', () => {
  expect(logicProblems(DriftForm, DriftValues)).toEqual([])
})

test('known gap: a type switch keeps rules the new kind cannot evaluate', () => {
  // Finding 3 (MCDriftLogic). The builder neither drops nor flags them, so the jump silently
  // stops working. When the builder prunes them, these lists become empty.
  expect(logicProblems(switchKind(DriftForm, 'd1', FieldKindEnum.NUMBER), DriftValues)).toEqual([
    'd1: rule nav-d3-skip can never fire'
  ])
  expect(logicProblems(switchKind(DriftForm, 'd2', FieldKindEnum.NUMBER), DriftValues)).toEqual([
    'd2: rule nav-d3-y can never fire',
    'd2: rule nav-end-n can never fire'
  ])

  // yes/no -> short text keeps "is y", which now fires on the typed text "y"
  const text = switchKind(DriftForm, 'd2', FieldKindEnum.SHORT_TEXT)
  expect(text.logics.find(l => l.fieldId === 'd2')?.payloads.map(p => p.condition)).toEqual([
    { comparison: ComparisonEnum.IS, expected: 'y' },
    { comparison: ComparisonEnum.IS, expected: 'n' }
  ])
})

test('known gap: a type switch can leave a calculate rule that never updates its variable', () => {
  // Finding 4 (MCDriftCalc): "total += d3" once d3 is text
  const problems = logicProblems(switchKind(DriftForm, 'd3', FieldKindEnum.SHORT_TEXT), DriftValues)

  expect(problems).toEqual(
    expect.arrayContaining([expect.stringContaining('d3: rule calc-total-d3 never changes total')])
  )
  expect(
    DriftForm.logics
      .find(l => l.fieldId === 'd3')
      ?.payloads.some(p => p.action.kind === ActionEnum.CALCULATE)
  ).toBe(true)
})
