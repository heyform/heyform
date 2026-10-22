import { ComparisonEnum, FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { OTHER_CHOICE_ID, validateCondition } from '../src'

test('validate text condition', () => {
  const field: FormField = {
    id: 'id_short_text',
    title: 'Short Text',
    kind: FieldKindEnum.SHORT_TEXT
  }
  const values = {
    id_short_text: 'This is probably a dog.'
  }

  const comparisons: any[] = [
    { comparison: ComparisonEnum.IS, expected: values.id_short_text, values },
    { comparison: ComparisonEnum.IS_NOT, expected: 'invalid_value', values },
    {
      comparison: ComparisonEnum.CONTAINS,
      expected: 'dog',
      values
    },
    {
      comparison: ComparisonEnum.DOES_NOT_CONTAIN,
      expected: 'cat',
      values
    },
    {
      comparison: ComparisonEnum.STARTS_WITH,
      expected: 'This',
      values
    },
    {
      comparison: ComparisonEnum.ENDS_WITH,
      expected: 'dog.',
      values
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})

test('validate legal terms condition', () => {
  const field: FormField = {
    id: 'id_legal_terms',
    title: 'Legal terms',
    kind: FieldKindEnum.LEGAL_TERMS
  }
  const values = {
    id_legal_terms: true
  }

  const comparisons: any[] = [
    {
      comparison: ComparisonEnum.IS,
      expected: values.id_legal_terms,
      values
    },
    {
      comparison: ComparisonEnum.IS_NOT,
      expected: values.id_legal_terms,
      values: {
        id_legal_terms: false
      }
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})

test('validate single choice condition', () => {
  const field: FormField = {
    id: 'id_single_choice',
    title: 'Single choice',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    properties: {
      choices: [
        {
          id: '_a',
          label: 'A'
        },
        {
          id: '_b',
          label: 'B'
        },
        {
          id: '_c',
          label: 'C'
        }
      ]
    }
  }
  const values = {
    id_single_choice: {
      value: ['_b']
    }
  }

  const comparisons: any[] = [
    {
      comparison: ComparisonEnum.IS,
      expected: values.id_single_choice.value[0],
      values
    },
    {
      comparison: ComparisonEnum.IS_NOT,
      expected: values.id_single_choice.value[0],
      values: {
        id_single_choice: {
          value: ['_c']
        }
      }
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})

test.each([FieldKindEnum.MULTIPLE_CHOICE, FieldKindEnum.PICTURE_CHOICE])(
  'preserves contains rules on single-select %s questions',
  kind => {
    const field: FormField = {
      id: 'choice',
      title: 'Choice',
      kind,
      properties: { allowMultiple: false }
    }
    const values = { choice: { value: ['a'] } }

    for (const expected of ['a', ['a']]) {
      expect(
        validateCondition(field, { comparison: ComparisonEnum.CONTAINS, expected }, values)
      ).toBe(true)
      expect(
        validateCondition(field, { comparison: ComparisonEnum.DOES_NOT_CONTAIN, expected }, values)
      ).toBe(false)
    }
    expect(
      validateCondition(field, { comparison: ComparisonEnum.CONTAINS, expected: 'b' }, values)
    ).toBe(false)
    expect(
      validateCondition(
        field,
        { comparison: ComparisonEnum.DOES_NOT_CONTAIN, expected: 'b' },
        values
      )
    ).toBe(true)
  }
)

test('validate single choice with other condition', () => {
  const field: FormField = {
    id: 'id_single_choice',
    title: 'Single choice',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    properties: {
      allowOther: true,
      choices: [
        {
          id: '_a',
          label: 'A'
        },
        {
          id: '_b',
          label: 'B'
        },
        {
          id: '_c',
          label: 'C'
        }
      ]
    }
  }
  const values = {
    id_single_choice: {
      other: 'Other'
    }
  }

  const comparisons: any[] = [
    {
      comparison: ComparisonEnum.IS,
      expected: values.id_single_choice.other,
      values
    },
    {
      comparison: ComparisonEnum.IS_NOT,
      expected: values.id_single_choice.other,
      values: {
        id_single_choice: {
          value: ['_c']
        }
      }
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})

test('validate multiple choice condition', () => {
  const field: FormField = {
    id: 'id_multiple_choice',
    title: 'Multiple choice',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    properties: {
      allowMultiple: true,
      choices: [
        {
          id: '_a',
          label: 'A'
        },
        {
          id: '_b',
          label: 'B'
        },
        {
          id: '_c',
          label: 'C'
        }
      ]
    }
  }
  const values = {
    id_multiple_choice: {
      value: ['_a', '_c']
    }
  }

  const comparisons: any[] = [
    {
      comparison: ComparisonEnum.IS,
      expected: values.id_multiple_choice.value,
      values
    },
    {
      comparison: ComparisonEnum.IS_NOT,
      expected: values.id_multiple_choice.value,
      values: {
        id_multiple_choice: {
          value: ['_b']
        }
      }
    },
    {
      comparison: ComparisonEnum.CONTAINS,
      expected: ['_c'],
      values
    },
    {
      comparison: ComparisonEnum.DOES_NOT_CONTAIN,
      expected: ['_b'],
      values
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})

test('validate multiple choice condition with undefined', () => {
  const field: FormField = {
    id: 'id_multiple_choice',
    title: 'Multiple choice',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    properties: {
      allowMultiple: true,
      choices: [
        {
          id: '_a',
          label: 'A'
        },
        {
          id: '_b',
          label: 'B'
        },
        {
          id: '_c',
          label: 'C'
        }
      ]
    }
  }
  const values: any = {
    id_multiple_choice: undefined
  }

  const comparisons: any[] = [
    {
      comparison: ComparisonEnum.CONTAINS,
      expected: ['_c'],
      values
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(false)
  }
})

test('a rule naming "Other" matches any Other answer, typed or not', () => {
  const field: FormField = {
    id: 'choice',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    properties: {
      allowMultiple: true,
      allowOther: true,
      choices: [
        { id: '_a', label: 'A' },
        { id: '_b', label: 'B' }
      ]
    }
  }
  const check = (comparison: ComparisonEnum, expected: unknown, value: unknown) =>
    validateCondition(field, { comparison, expected } as any, { choice: value } as any)

  for (const other of ['Anything', '']) {
    expect(check(ComparisonEnum.IS, OTHER_CHOICE_ID, { value: [], other })).toBe(true)
    expect(check(ComparisonEnum.IS, [OTHER_CHOICE_ID], { value: [], other })).toBe(true)
    expect(check(ComparisonEnum.IS_NOT, OTHER_CHOICE_ID, { value: [], other })).toBe(false)
    expect(check(ComparisonEnum.CONTAINS, [OTHER_CHOICE_ID], { value: ['_a'], other })).toBe(true)
    expect(check(ComparisonEnum.IS, ['_a', OTHER_CHOICE_ID], { value: ['_a'], other })).toBe(true)
  }

  expect(check(ComparisonEnum.IS, OTHER_CHOICE_ID, { value: ['_a'] })).toBe(false)
  expect(check(ComparisonEnum.IS, OTHER_CHOICE_ID, undefined)).toBe(false)
  expect(check(ComparisonEnum.IS_NOT, OTHER_CHOICE_ID, { value: ['_a'] })).toBe(true)
  expect(check(ComparisonEnum.DOES_NOT_CONTAIN, [OTHER_CHOICE_ID], { value: ['_a'] })).toBe(true)
  // An option rule never matches an Other answer.
  expect(check(ComparisonEnum.IS, '_a', { value: [], other: 'Anything' })).toBe(false)
  // Rules written against the typed text keep comparing it.
  expect(check(ComparisonEnum.IS, 'Anything', { value: [], other: 'Anything' })).toBe(true)
  expect(check(ComparisonEnum.IS, 'Anything', { value: [], other: 'Else' })).toBe(false)
})

test('validate multiple choice with other condition', () => {
  const field: FormField = {
    id: 'id_multiple_choice',
    title: 'Multiple choice',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    properties: {
      allowMultiple: true,
      allowOther: true,
      choices: [
        {
          id: '_a',
          label: 'A'
        },
        {
          id: '_b',
          label: 'B'
        },
        {
          id: '_c',
          label: 'C'
        }
      ]
    }
  }
  const values = {
    id_multiple_choice: {
      value: ['_a', '_c'],
      other: 'Other'
    }
  }

  const comparisons: any[] = [
    {
      comparison: ComparisonEnum.IS,
      expected: [...values.id_multiple_choice.value, values.id_multiple_choice.other],
      values
    },
    {
      comparison: ComparisonEnum.IS_NOT,
      expected: [...values.id_multiple_choice.value, values.id_multiple_choice.other],
      values: {
        id_multiple_choice: {
          value: ['_b']
        }
      }
    },
    {
      comparison: ComparisonEnum.CONTAINS,
      expected: ['_c'],
      values
    },
    {
      comparison: ComparisonEnum.CONTAINS,
      expected: ['Other'],
      values
    },
    {
      comparison: ComparisonEnum.DOES_NOT_CONTAIN,
      expected: ['_b'],
      values
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})

test('validate date condition', () => {
  const field: FormField = {
    id: 'id_date',
    title: 'Date',
    kind: FieldKindEnum.DATE,
    properties: {
      format: 'YYYY-MM-DD'
    }
  }
  const values = {
    id_date: '2020-01-01'
  }

  const comparisons: any[] = [
    {
      comparison: ComparisonEnum.IS,
      expected: values.id_date,
      values
    },
    {
      comparison: ComparisonEnum.IS_NOT,
      expected: values.id_date,
      values: {
        id_date: '1990-01-01'
      }
    },
    {
      comparison: ComparisonEnum.IS_BEFORE,
      expected: values.id_date,
      values: {
        id_date: '1990-01-01'
      }
    },
    {
      comparison: ComparisonEnum.IS_AFTER,
      expected: values.id_date,
      values: {
        id_date: '2020-08-08'
      }
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})

test('validate number condition', () => {
  const field: FormField = {
    id: 'id_number',
    title: 'Number',
    kind: FieldKindEnum.NUMBER
  }
  const values = {
    id_number: 10
  }

  const comparisons: any[] = [
    { comparison: ComparisonEnum.EQUAL, expected: values.id_number, values },
    {
      comparison: ComparisonEnum.NOT_EQUAL,
      expected: 30,
      values
    },
    {
      comparison: ComparisonEnum.GREATER_THAN,
      expected: 5,
      values
    },
    {
      comparison: ComparisonEnum.LESS_THAN,
      expected: 20,
      values
    },
    {
      comparison: ComparisonEnum.GREATER_OR_EQUAL_THAN,
      expected: 10,
      values
    },
    {
      comparison: ComparisonEnum.LESS_OR_EQUAL_THAN,
      expected: 10,
      values
    }
  ]

  for (const comparison of comparisons) {
    expect(validateCondition(field, comparison, comparison.values)).toBe(true)
  }
})
