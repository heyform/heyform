import {
  ComparisonEnum,
  DateCondition,
  FieldKindEnum,
  FormField
} from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { fieldsToValidateRules, validate, validateCondition } from '../src'

// Formats offered in the form builder (DATE_FORMAT_OPTIONS).
const DATE_FORMATS = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY/MM/DD',
  'MM-DD-YYYY',
  'DD-MM-YYYY',
  'YYYY-MM-DD',
  'MM.DD.YYYY',
  'DD.MM.YYYY',
  'YYYY.MM.DD'
]

function formatAnswer(format: string, year: number, month: number, day: number, time?: string) {
  const parts: Record<string, string> = {
    YYYY: String(year),
    MM: String(month).padStart(2, '0'),
    DD: String(day).padStart(2, '0')
  }
  const date = format.replace(/YYYY|MM|DD/g, token => parts[token])

  return time ? `${date} ${time}` : date
}

function dateField(format: string, allowTime = false): FormField {
  return {
    id: 'date',
    title: 'Date',
    kind: FieldKindEnum.DATE,
    properties: { format, allowTime }
  }
}

function matches(
  field: FormField,
  comparison: DateCondition['comparison'],
  expected: string,
  answer: string
) {
  const condition: DateCondition = { comparison, expected }

  return validateCondition(field, condition, { [field.id]: answer })
}

test.each(DATE_FORMATS)('date logic uses %s', format => {
  const field = dateField(format)
  const april3 = formatAnswer(format, 2026, 4, 3)
  const december25 = formatAnswer(format, 2026, 12, 25)

  expect(matches(field, ComparisonEnum.IS, '2026-04-03', april3)).toBe(true)
  // The swapped month/day must not count as this answer.
  expect(matches(field, ComparisonEnum.IS, '2026-03-04', april3)).toBe(false)
  expect(matches(field, ComparisonEnum.IS_NOT, '2026-03-04', april3)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_BEFORE, '2026-04-04', april3)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-04-02', april3)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_BEFORE, '2026-04-03', april3)).toBe(false)
  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-04-03', april3)).toBe(false)
  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-01-01', december25)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_BEFORE, '2026-01-01', december25)).toBe(false)
})

test.each(DATE_FORMATS)('date logic uses %s with time', format => {
  const field = dateField(format, true)
  const april3 = formatAnswer(format, 2026, 4, 3, '09:15')
  const december25 = formatAnswer(format, 2026, 12, 25, '18:45')

  expect(matches(field, ComparisonEnum.IS, '2026-04-03 09:15', april3)).toBe(true)
  expect(matches(field, ComparisonEnum.IS, '2026-03-04 09:15', april3)).toBe(false)
  expect(matches(field, ComparisonEnum.IS, '2026-04-03 09:16', april3)).toBe(false)
  expect(matches(field, ComparisonEnum.IS_NOT, '2026-03-04 09:15', april3)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_BEFORE, '2026-04-03 10:00', april3)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-04-03 08:00', april3)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-01-01 00:00', december25)).toBe(true)
  expect(matches(field, ComparisonEnum.IS_BEFORE, '2026-01-01 00:00', december25)).toBe(false)
})

test('DD/MM/YYYY answers match the calendar day, not Date.parse', () => {
  const field = dateField('DD/MM/YYYY')

  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-01-01', '25/12/2026')).toBe(true)
  expect(matches(field, ComparisonEnum.IS, '2026-04-03', '03/04/2026')).toBe(true)
  expect(matches(field, ComparisonEnum.IS, '2026-03-04', '03/04/2026')).toBe(false)
})

test('unparseable and invalid dates do not match a real day', () => {
  const cases: Array<[string, string, string]> = [
    ['DD/MM/YYYY', 'not-a-date', '2026-04-03'],
    ['DD/MM/YYYY', '32/13/2026', '2026-04-03'],
    ['DD/MM/YYYY', '31/02/2026', '2026-03-02'],
    ['DD-MM-YYYY', '31-02-2026', '2026-03-02'],
    ['DD.MM.YYYY', '31.02.2026', '2026-03-02'],
    // Date.parse overflows these onto 3 March. The logic must not follow it.
    ['MM/DD/YYYY', '02/31/2026', '2026-03-03'],
    ['MM-DD-YYYY', '02-31-2026', '2026-03-03'],
    ['MM.DD.YYYY', '02.31.2026', '2026-03-03'],
    ['YYYY-MM-DD', '2026-02-31', '2026-03-03'],
    ['YYYY/MM/DD', '2026/02/31', '2026-03-03'],
    ['YYYY.MM.DD', '2026.02.31', '2026-03-03']
  ]

  for (const [format, answer, expected] of cases) {
    const field = dateField(format)

    expect(matches(field, ComparisonEnum.IS, expected, answer)).toBe(false)
    expect(matches(field, ComparisonEnum.IS_BEFORE, expected, answer)).toBe(false)
    expect(matches(field, ComparisonEnum.IS_AFTER, expected, answer)).toBe(false)
  }
})

test('a DD/MM/YYYY date range is ordered by the field format', () => {
  const [rule] = fieldsToValidateRules([
    {
      id: 'range',
      title: 'Range',
      kind: FieldKindEnum.DATE_RANGE,
      properties: { format: 'DD/MM/YYYY' }
    }
  ])

  expect(validate(rule, { start: '03/04/2026', end: '03/04/2026' })).toBe(undefined)
  expect(validate(rule, { start: '03/04/2026', end: '01/05/2026' })).toBe(undefined)
  expect(() => validate(rule, { start: '05/04/2026', end: '06/03/2026' })).toThrow(
    'End date must be after start date'
  )
})

test('a DD/MM/YYYY date range with time is ordered by the field format', () => {
  const [rule] = fieldsToValidateRules([
    {
      id: 'range',
      title: 'Range',
      kind: FieldKindEnum.DATE_RANGE,
      properties: { format: 'DD/MM/YYYY', allowTime: true }
    }
  ])

  expect(validate(rule, { start: '03/04/2026 10:00', end: '01/05/2026 09:00' })).toBe(undefined)
  expect(() => validate(rule, { start: '01/05/2026 10:00', end: '03/04/2026 10:00' })).toThrow(
    'End date must be after start date'
  )
})

test('a condition date saved in another shape still matches', () => {
  const field = dateField('DD/MM/YYYY')

  // Form owners typed these before the condition's date was parsed strictly
  expect(matches(field, ComparisonEnum.IS, '2026-4-3', '03/04/2026')).toBe(true)
  expect(matches(field, ComparisonEnum.IS, '2026/04/03', '03/04/2026')).toBe(true)
  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-1-1', '25/12/2026')).toBe(true)
  expect(matches(field, ComparisonEnum.IS_BEFORE, '2026-1-1', '03/04/2026')).toBe(false)
})

test('a condition date that is not a date matches nothing', () => {
  const field = dateField('DD/MM/YYYY')

  expect(matches(field, ComparisonEnum.IS, 'not-a-date', '03/04/2026')).toBe(false)
  expect(matches(field, ComparisonEnum.IS_BEFORE, 'not-a-date', '03/04/2026')).toBe(false)
  expect(matches(field, ComparisonEnum.IS_AFTER, 'not-a-date', '03/04/2026')).toBe(false)
  expect(matches(field, ComparisonEnum.IS_NOT, 'not-a-date', '03/04/2026')).toBe(true)
})

test('a lenient condition date does not make the answer lenient', () => {
  const field = dateField('DD/MM/YYYY')

  // 31 February is still rejected on the answer side
  expect(matches(field, ComparisonEnum.IS, '2026-3-2', '31/02/2026')).toBe(false)
  expect(matches(field, ComparisonEnum.IS_AFTER, '2026-3-2', '31/02/2026')).toBe(false)
})
