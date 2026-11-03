import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  FormField,
  Logic,
  Variable
} from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { resolveEnding } from '../src'

const question: FormField = { id: 'q1', kind: FieldKindEnum.SHORT_TEXT }
const first: FormField = { id: 'first', kind: FieldKindEnum.THANK_YOU }
const second: FormField = { id: 'second', kind: FieldKindEnum.THANK_YOU }
const fields = [question, first, second]

const logics: Logic[] = [
  {
    fieldId: 'q1',
    payloads: [
      {
        id: 'p1',
        condition: { comparison: ComparisonEnum.IS, expected: 'no' },
        action: { kind: ActionEnum.NAVIGATE, fieldId: 'second' }
      }
    ]
  }
]

test('a logic jump picks its ending', () => {
  expect(resolveEnding(fields, logics, [], { q1: 'no' })?.id).toBe('second')
})

test('a route with no jump falls through to the first ending', () => {
  expect(resolveEnding(fields, logics, [], { q1: 'yes' })?.id).toBe('first')
})

test('the last field on the route decides, not the first', () => {
  const last: FormField = { id: 'q2', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'second' }

  expect(resolveEnding([question, last, first, second], [], [], { q1: 'a' })?.id).toBe('second')
})

test('a form with only endings falls through to the first ending', () => {
  expect(resolveEnding([first, second])?.id).toBe('first')
})

test('a variable rule picks its ending, using the logic that calculates it', () => {
  const variables = [
    {
      id: 'score',
      kind: 'number',
      value: 0,
      logics: [
        {
          condition: { comparison: ComparisonEnum.GREATER_THAN, expected: 5 },
          action: { kind: ActionEnum.NAVIGATE, fieldId: 'second' }
        }
      ]
    }
  ] as unknown as Variable[]
  const calculate = (expected: string, value: number): Logic[] => [
    {
      fieldId: 'q1',
      payloads: [
        {
          id: 'p1',
          condition: { comparison: ComparisonEnum.IS, expected },
          action: {
            kind: ActionEnum.CALCULATE,
            variable: 'score',
            operator: 'addition',
            value
          } as any
        }
      ]
    }
  ]

  expect(resolveEnding(fields, calculate('a', 6), variables, { q1: 'a' })?.id).toBe('second')
  expect(resolveEnding(fields, calculate('a', 1), variables, { q1: 'a' })?.id).toBe('first')
})

test('forms stored without logic or variables still resolve', () => {
  expect(resolveEnding(fields, null, null, { q1: 'no' })?.id).toBe('first')
})

test('a form without endings has no ending', () => {
  expect(resolveEnding([question], logics, [], { q1: 'no' })).toBeUndefined()
})

test('stored field order and the welcome screen do not change the ending', () => {
  const welcome: FormField = { id: 'hello', kind: FieldKindEnum.WELCOME }

  expect(resolveEnding([first, welcome, question, second], logics, [], { q1: 'no' })?.id).toBe(
    'second'
  )
})

test('a partial submission ends at the first unanswered jump question', () => {
  const later: FormField = { id: 'q2', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'second' }

  expect(resolveEnding([question, later, first, second], logics, [], {}, true)?.id).toBe('first')
  expect(resolveEnding([question, later, first, second], logics, [], {}, false)?.id).toBe('second')
})

test('a partial submission ignores calculations past where it stops', () => {
  const later: FormField = { id: 'q2', kind: FieldKindEnum.SHORT_TEXT }
  const variables = [
    {
      id: 'score',
      kind: 'number',
      value: 0,
      logics: [
        {
          condition: { comparison: ComparisonEnum.GREATER_THAN, expected: 5 },
          action: { kind: ActionEnum.NAVIGATE, fieldId: 'second' }
        }
      ]
    }
  ] as unknown as Variable[]
  const jumpAndCalculate: Logic[] = [
    ...logics,
    {
      fieldId: 'q2',
      payloads: [
        {
          id: 'p2',
          condition: { comparison: ComparisonEnum.IS, expected: 'a' },
          action: {
            kind: ActionEnum.CALCULATE,
            variable: 'score',
            operator: 'addition',
            value: 6
          } as any
        }
      ]
    }
  ]
  const form = [question, later, first, second]
  const answers = { q2: 'a' }

  expect(resolveEnding(form, jumpAndCalculate, variables, answers, true)?.id).toBe('first')
  expect(resolveEnding(form, jumpAndCalculate, variables, answers, false)?.id).toBe('second')
})

test('a calculation cannot read an answer from outside the submitted route', () => {
  const variables = [
    {
      id: 'score',
      kind: 'number',
      value: 0,
      logics: [
        {
          condition: { comparison: ComparisonEnum.GREATER_THAN, expected: 5 },
          action: { kind: ActionEnum.NAVIGATE, fieldId: 'second' }
        }
      ]
    }
  ] as unknown as Variable[]
  const addLater = {
    fieldId: 'q1',
    payloads: [
      {
        id: 'add',
        condition: { comparison: ComparisonEnum.IS, expected: 'yes' },
        action: {
          kind: ActionEnum.CALCULATE,
          variable: 'score',
          operator: 'addition',
          ref: 'later'
        } as any
      }
    ]
  }
  const later: FormField = { id: 'later', kind: FieldKindEnum.NUMBER }
  const answers = { q1: 'yes', later: 6 }

  // A partial submission that stops at a jump question before the answer it reads
  const jump: FormField = { id: 'jump', kind: FieldKindEnum.SHORT_TEXT }
  const jumpLogic: Logic = {
    fieldId: 'jump',
    payloads: [
      {
        id: 'p2',
        condition: { comparison: ComparisonEnum.IS, expected: 'skip' },
        action: { kind: ActionEnum.NAVIGATE, fieldId: 'later' }
      }
    ]
  }
  const stopped = [question, jump, later, first, second]

  expect(resolveEnding(stopped, [addLater, jumpLogic], variables, answers, true)?.id).toBe('first')

  // A whole route that jumps past the answer it reads
  const skipping = [{ ...question, nextFieldId: 'first' }, later, first, second]

  expect(resolveEnding(skipping, [addLater], variables, answers)?.id).toBe('first')

  // The same reference still counts when the answer is on the route
  expect(resolveEnding([question, later, first, second], [addLater], variables, answers)?.id).toBe(
    'second'
  )
})

test('an unanswered question resolves the same before and after JSON', () => {
  const optional: FormField = { id: 'q', kind: FieldKindEnum.NUMBER }
  const variables = [
    {
      id: 'score',
      kind: 'number',
      value: 0,
      logics: [
        {
          condition: { comparison: ComparisonEnum.GREATER_THAN, expected: 5 },
          action: { kind: ActionEnum.NAVIGATE, fieldId: 'second' }
        }
      ]
    }
  ] as unknown as Variable[]
  const addUnlessOne: Logic[] = [
    {
      fieldId: 'q',
      payloads: [
        {
          id: 'p1',
          condition: { comparison: ComparisonEnum.NOT_EQUAL, expected: 1 },
          action: {
            kind: ActionEnum.CALCULATE,
            variable: 'score',
            operator: 'addition',
            value: 10
          } as any
        }
      ]
    }
  ]
  const form = [optional, first, second]
  const inBrowser = { q: undefined } as any
  const onServer = JSON.parse(JSON.stringify(inBrowser))

  expect(onServer).toEqual({})
  expect(resolveEnding(form, addUnlessOne, variables, inBrowser)?.id).toBe('second')
  expect(resolveEnding(form, addUnlessOne, variables, onServer)?.id).toBe('second')
})

test('resolving an ending leaves the fields untouched', () => {
  const stored = [{ ...question }, { ...first }, { ...second }]

  resolveEnding(stored, logics, [], { q1: 'no' })

  expect(stored).toEqual([question, first, second])
})
