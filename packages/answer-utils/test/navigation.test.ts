import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  FormField,
  Logic
} from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import {
  applyLogicToFields,
  createFieldNavigation,
  getNextFieldId,
  isValidNextFieldId,
  validateFields
} from '../src'

test('duplicate IDs cannot send traversal back to an earlier position', () => {
  const fields: FormField[] = [
    { id: 'a', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'b' },
    { id: 'b', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'a', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'b' }
  ]
  const navigation = createFieldNavigation(fields)
  expect(navigation.indexOf('a')).toBe(0)
  expect(navigation.getNextIndex(1)).toBe(2)
  expect(navigation.getNextIndex(2)).toBe(3)
  expect(applyLogicToFields(fields).fields.map(field => field.id)).toEqual(['a', 'b', 'a'])
})

test('a new navigation index reflects reordering and deletion', () => {
  const fields = branchingFields()
  const navigation = createFieldNavigation(fields)
  expect(navigation.getNextFieldId('q3')).toBe('q6')
  const reordered = [fields[5], ...fields.slice(0, 5), fields[6]]
  expect(createFieldNavigation(reordered).getNextFieldId('q3')).toBe('q4')
  expect(
    createFieldNavigation(fields.filter(field => field.id !== 'q6')).getNextFieldId('q3')
  ).toBe('q4')
})

function branchingFields(): FormField[] {
  return [
    {
      id: 'q1',
      kind: FieldKindEnum.SHORT_TEXT,
      nextFieldId: 'q4',
      validations: { required: true }
    },
    { id: 'q2', kind: FieldKindEnum.SHORT_TEXT, validations: { required: true } },
    {
      id: 'q3',
      kind: FieldKindEnum.SHORT_TEXT,
      nextFieldId: 'q6',
      validations: { required: true }
    },
    { id: 'q4', kind: FieldKindEnum.SHORT_TEXT, validations: { required: true } },
    {
      id: 'q5',
      kind: FieldKindEnum.SHORT_TEXT,
      nextFieldId: 'q6',
      validations: { required: true }
    },
    { id: 'q6', kind: FieldKindEnum.SHORT_TEXT, validations: { required: true } },
    { id: 'end', kind: FieldKindEnum.THANK_YOU }
  ]
}

const logics: Logic[] = [
  {
    fieldId: 'q1',
    payloads: [
      {
        id: 'motion',
        condition: { comparison: ComparisonEnum.IS, expected: 'Motion Designer' },
        action: { kind: ActionEnum.NAVIGATE, fieldId: 'q2' }
      }
    ]
  }
]

test('a conditional branch overrides the default and converges without crossing the other branch', () => {
  const values = { q1: 'Motion Designer', q2: 'a', q3: 'b', q6: 'c' }
  const result = applyLogicToFields(branchingFields(), logics, undefined, values)

  expect(result.fields.map(f => f.id)).toEqual(['q1', 'q2', 'q3', 'q6'])
  expect(() => validateFields(result.fields, values)).not.toThrow()
})

test('an unmatched conditional uses the default branch and converges', () => {
  const values = { q1: 'Producer', q4: 'a', q5: 'b', q6: 'c' }
  const result = applyLogicToFields(branchingFields(), logics, undefined, values)

  expect(result.fields.map(f => f.id)).toEqual(['q1', 'q4', 'q5', 'q6'])
  expect(() => validateFields(result.fields, values)).not.toThrow()
})

test('defaults apply with no answers and no conditional rules', () => {
  expect(applyLogicToFields(branchingFields()).fields.map(f => f.id)).toEqual([
    'q1',
    'q4',
    'q5',
    'q6'
  ])
})

test('changing an earlier answer rebuilds the selected route', () => {
  const fields = branchingFields()
  applyLogicToFields(fields, logics, undefined, { q1: 'Motion Designer', q2: 'a', q3: 'b' })
  expect(
    applyLogicToFields(fields, logics, undefined, { q1: 'Producer' }).fields.map(f => f.id)
  ).toEqual(['q1', 'q4', 'q5', 'q6'])
})

test('an explicit ending stops the route before later required questions', () => {
  const fields = branchingFields()
  fields[0].nextFieldId = 'end'

  expect(applyLogicToFields(fields).fields.map(f => f.id)).toEqual(['q1'])
  expect(getNextFieldId(fields, 'end')).toBeUndefined()
})

test('removing a default restores form order', () => {
  const fields = branchingFields()
  delete fields[2].nextFieldId

  expect(getNextFieldId(fields, 'q3')).toBe('q4')
})

test('an explicit destination stays connected when a question is inserted between nodes', () => {
  const fields = branchingFields()
  fields.splice(3, 0, { id: 'inserted', kind: FieldKindEnum.SHORT_TEXT })
  const values = { q1: 'Motion Designer', q2: 'a', q3: 'b', q6: 'c' }

  expect(applyLogicToFields(fields, logics, undefined, values).fields.map(f => f.id)).toEqual([
    'q1',
    'q2',
    'q3',
    'q6'
  ])
})

test('a matched conditional ending overrides the default next question', () => {
  const endingLogic: Logic[] = [
    {
      ...logics[0],
      payloads: [
        { ...logics[0].payloads[0], action: { kind: ActionEnum.NAVIGATE, fieldId: 'end' } }
      ]
    }
  ]

  expect(
    applyLogicToFields(branchingFields(), endingLogic, undefined, {
      q1: 'Motion Designer'
    }).fields.map(f => f.id)
  ).toEqual(['q1'])
})

test('a statement can skip questions without fabricating a condition', () => {
  const fields: FormField[] = [
    { id: 'statement', kind: FieldKindEnum.STATEMENT, nextFieldId: 'q2' },
    { id: 'q1', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'q2', kind: FieldKindEnum.SHORT_TEXT }
  ]

  expect(applyLogicToFields(fields).fields.map(f => f.id)).toEqual(['statement', 'q2'])
})

test('missing, self, and backward destinations fall back safely to form order', () => {
  for (const target of ['deleted', 'q3', 'q1']) {
    const fields = branchingFields()
    fields[2].nextFieldId = target
    expect(isValidNextFieldId(fields, 'q3', target)).toBe(false)
    expect(getNextFieldId(fields, 'q3')).toBe('q4')
  }
})

test('a group child can converge on a question outside its group', () => {
  const group: FormField = { id: 'group', kind: FieldKindEnum.GROUP }
  const fields = [
    group,
    { id: 'child', kind: FieldKindEnum.SHORT_TEXT, parent: group, nextFieldId: 'q6' },
    { id: 'skipped', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'q6', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'end', kind: FieldKindEnum.THANK_YOU }
  ]

  expect(applyLogicToFields(fields).fields.map(f => f.id)).toEqual(['group', 'child', 'q6'])
})
