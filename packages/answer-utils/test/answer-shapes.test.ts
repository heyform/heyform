import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { ValidateError, fieldValuesToAnswers } from '../src'

// Every value here used to be stored (or to throw a TypeError instead of a ValidateError), and the
// submissions table or the server then had to cope with a shape the field never produces.
function store(kind: FieldKindEnum, value: unknown, properties: Record<string, any> = {}) {
  return fieldValuesToAnswers(
    [{ id: 'f', title: 'f', kind, validations: { required: false }, properties } as any],
    { f: value }
  )
}

function rejects(kind: FieldKindEnum, value: unknown, properties?: Record<string, any>) {
  expect(() => store(kind, value, properties)).toThrow(ValidateError)
}

const choices = [
  { id: 'c1', label: 'One' },
  { id: 'c2', label: 'Two' }
]

test('a number must be a number or numeric text, not an array', () => {
  rejects(FieldKindEnum.NUMBER, [3])
  rejects(FieldKindEnum.NUMBER, ['3'])
  expect(store(FieldKindEnum.NUMBER, 3)[0].value).toBe(3)
  expect(store(FieldKindEnum.NUMBER, '3.5')[0].value).toBe('3.5')
})

test.each([FieldKindEnum.RATING, FieldKindEnum.OPINION_SCALE])(
  '%s only accepts a whole number in range',
  kind => {
    for (const value of ['3abc', '0x3', '3.9', 3.9, [3], ' 3', 0, 6]) {
      rejects(kind, value, { total: 5 })
    }
    expect(store(kind, 3, { total: 5 })[0].value).toBe(3)
    expect(store(kind, '5', { total: 5 })[0].value).toBe('5')
  }
)

test('"Other" must be text', () => {
  const properties = { choices, allowOther: true, allowMultiple: true }

  rejects(FieldKindEnum.MULTIPLE_CHOICE, { value: [], other: { a: 1 } }, properties)
  rejects(FieldKindEnum.MULTIPLE_CHOICE, { value: ['c1'], other: ['x'] }, properties)
  rejects(FieldKindEnum.MULTIPLE_CHOICE, { value: ['c1'], other: 5 }, properties)
  expect(
    store(FieldKindEnum.MULTIPLE_CHOICE, { value: ['c1'], other: 'x' }, properties)[0].value
  ).toEqual({
    value: ['c1'],
    other: 'x'
  })
})

test('the parts of a full name and an address must be text', () => {
  rejects(FieldKindEnum.FULL_NAME, { firstName: { a: 1 }, lastName: 'b' })
  rejects(FieldKindEnum.FULL_NAME, { firstName: 'a', lastName: ['b'] })
  rejects(FieldKindEnum.ADDRESS, {
    address1: { a: 1 },
    city: 'c',
    state: 's',
    zip: 'z',
    country: 'US'
  })
  rejects(FieldKindEnum.ADDRESS, {
    address1: 'a',
    address2: 7,
    city: 'c',
    state: 's',
    zip: 'z',
    country: 'US'
  })
  expect(store(FieldKindEnum.FULL_NAME, { firstName: 'a', lastName: 'b' })[0].value).toEqual({
    firstName: 'a',
    lastName: 'b'
  })
})

test('input table cells must be plain values', () => {
  rejects(FieldKindEnum.INPUT_TABLE, [{ col1: { a: 1 } }])
  rejects(FieldKindEnum.INPUT_TABLE, [{ col1: ['x'] }])
  expect(store(FieldKindEnum.INPUT_TABLE, [{ col1: 'x', col2: '' }])[0].value).toEqual([
    { col1: 'x', col2: '' }
  ])
})

test('a malformed date range or phone number is a validation error, not a TypeError', () => {
  for (const value of [
    {},
    { start: null },
    { start: 3, end: '2024-01-01' },
    { start: '2024-01-01', end: {} }
  ]) {
    rejects(FieldKindEnum.DATE_RANGE, value, { format: 'YYYY-MM-DD' })
  }
  for (const value of [[null], 14155552671, { number: '+14155552671' }]) {
    rejects(FieldKindEnum.PHONE_NUMBER, value)
  }
})
