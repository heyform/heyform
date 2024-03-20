import { validateCondition } from '../src'
import { ComparisonEnum, FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'

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
