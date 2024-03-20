import { applyLogicToFields } from '../src'
import {
  ActionEnum,
  CalculateEnum,
  ComparisonEnum,
  FieldKindEnum,
  FormField,
  Logic,
  Variable
} from '@heyform-inc/shared-types-enums'

const fields: FormField[] = [
  {
    id: 'id_short_text',
    title: 'Short Text',
    kind: FieldKindEnum.SHORT_TEXT
  },
  {
    id: 'id_statement',
    title: 'Statement',
    kind: FieldKindEnum.STATEMENT
  },
  {
    id: 'id_number',
    title: 'Number',
    kind: FieldKindEnum.NUMBER
  },
  {
    id: 'id_statement2',
    title: 'Statement2',
    kind: FieldKindEnum.STATEMENT
  },
  {
    id: 'id_date',
    title: 'Date',
    kind: FieldKindEnum.DATE
  }
]

const logics: Logic[] = [
  {
    fieldId: 'id_short_text',
    payloads: [
      {
        id: 'p1',
        condition: {
          comparison: ComparisonEnum.CONTAINS,
          expected: 'kitty'
        },
        action: {
          kind: ActionEnum.NAVIGATE,
          fieldId: fields[2].id
        }
      }
    ]
  },
  {
    fieldId: 'id_number',
    payloads: [
      {
        id: 'p2',
        condition: {
          comparison: ComparisonEnum.EQUAL,
          expected: 5
        },
        action: {
          kind: ActionEnum.NAVIGATE,
          fieldId: fields[fields.length - 1].id
        }
      }
    ]
  }
]

const variables: Variable[] = [
  {
    id: 'number_var',
    name: 'Score',
    kind: 'number',
    value: 0
  },
  {
    id: 'string_var',
    name: 'Name',
    kind: 'string',
    value: 'Your name is: '
  }
]

test('apply to fields with matched values', () => {
  const result = applyLogicToFields(fields, logics, undefined, {
    id_short_text: 'hello kitty',
    id_number: 5
  })

  expect(result.fields.map(f => f.id)).toStrictEqual(
    fields.filter(f => f.kind !== FieldKindEnum.STATEMENT).map(f => f.id)
  )
})

test('apply to fields with matched text value', () => {
  const result = applyLogicToFields(fields, logics, undefined, {
    id_short_text: 'hello kitty'
  })

  expect(result.fields.map(f => f.id)).toStrictEqual(
    fields.filter(f => f.id !== 'id_statement').map(f => f.id)
  )
})

test('apply to fields with matched number value', () => {
  const result = applyLogicToFields(fields, logics, undefined, {
    id_number: 5
  })

  expect(result.fields.map(f => f.id)).toStrictEqual(
    fields.filter(f => f.id !== 'id_statement2').map(f => f.id)
  )
})

test('apply to fields with unmatched values', () => {
  const result = applyLogicToFields(fields, logics, undefined, {
    id_short_text: 'hello world',
    id_number: 10
  })
  expect(result.fields.map(f => f.id)).toStrictEqual(fields.map(f => f.id))
})

test('apply to fields with empty values', () => {
  const result = applyLogicToFields(fields, logics)
  expect(result.fields.map(f => f.id)).toStrictEqual(fields.map(f => f.id))
})

test('apply to fields without logics', () => {
  const result = applyLogicToFields(fields, undefined, undefined, {
    id_short_text: 'hello kitty'
  })
  expect(result.fields.map(f => f.id)).toStrictEqual(fields.map(f => f.id))
})

test('apply to fields with empty fields', () => {
  const result = applyLogicToFields([], logics, undefined, {
    id_short_text: 'hello world',
    id_number: 10
  })
  expect(result.fields.map(f => f.id)).toStrictEqual([])
})

test('apply to fields with circular navigate logics', () => {
  const _logics: Logic[] = [
    logics[0],
    {
      fieldId: 'id_number',
      payloads: [
        {
          id: 'p2',
          condition: {
            comparison: ComparisonEnum.EQUAL,
            expected: 5
          },
          action: {
            kind: ActionEnum.NAVIGATE,
            fieldId: fields[0].id
          }
        }
      ]
    }
  ]

  const result = applyLogicToFields(fields, _logics, undefined, {
    id_short_text: 'hello kitty',
    id_number: 5
  })
  expect(result.fields.map(f => f.id)).toStrictEqual(
    fields.filter(f => f.id !== 'id_statement').map(f => f.id)
  )
})

test('apply to fields with variables', () => {
  const _logics: Logic[] = [
    {
      fieldId: 'id_short_text',
      payloads: [
        {
          id: 'p1',
          condition: {
            comparison: ComparisonEnum.CONTAINS,
            expected: 'kitty'
          },
          action: {
            kind: ActionEnum.NAVIGATE,
            fieldId: fields[2].id
          }
        },
        {
          id: 'p2',
          condition: {
            comparison: ComparisonEnum.ENDS_WITH,
            expected: 'kitty'
          },
          action: {
            kind: ActionEnum.CALCULATE,
            variable: 'number_var',
            operator: CalculateEnum.ADDITION,
            value: 2
          }
        },
        {
          id: 'p3',
          condition: {
            comparison: ComparisonEnum.STARTS_WITH,
            expected: 'hello'
          },
          action: {
            kind: ActionEnum.CALCULATE,
            variable: 'string_var',
            operator: CalculateEnum.ADDITION,
            ref: 'id_short_text'
          }
        },
        {
          id: 'p5',
          condition: {
            comparison: ComparisonEnum.IS_NOT_EMPTY
          },
          action: {
            kind: ActionEnum.CALCULATE,
            variable: 'string_var2',
            operator: CalculateEnum.ASSIGNMENT,
            value: 'catting'
          }
        }
      ]
    },
    {
      fieldId: 'id_number',
      payloads: [
        {
          id: 'p4',
          condition: {
            comparison: ComparisonEnum.EQUAL,
            expected: 5
          },
          action: {
            kind: ActionEnum.CALCULATE,
            variable: 'number_var',
            operator: CalculateEnum.MULTIPLICATION,
            value: 5
          }
        }
      ]
    }
  ]
  const result = applyLogicToFields(fields, _logics, variables, {
    id_short_text: 'hello kitty',
    id_number: 5
  })
  expect(result.fields.map(f => f.id)).toStrictEqual(
    fields.filter(f => f.id !== 'id_statement').map(f => f.id)
  )
  expect(result.variables).toStrictEqual({
    number_var: 10,
    string_var: 'Your name is: hello kitty'
  })
})

test('apply to group fields', () => {
  const _fields: any[] = [
    {
      id: 'id_short_text',
      title: 'Short Text',
      kind: FieldKindEnum.SHORT_TEXT
    },
    // Group start
    {
      id: 'id_group',
      title: 'Group',
      kind: FieldKindEnum.GROUP
    },
    {
      id: 'id_statement',
      title: 'Statement',
      kind: FieldKindEnum.STATEMENT,
      parent: {
        id: 'id_group',
        title: 'Group',
        kind: FieldKindEnum.GROUP
      }
    },
    {
      id: 'id_number',
      title: 'Number',
      kind: FieldKindEnum.NUMBER,
      parent: {
        id: 'id_group',
        title: 'Group',
        kind: FieldKindEnum.GROUP
      }
    },
    {
      id: 'id_statement2',
      title: 'Statement2',
      kind: FieldKindEnum.STATEMENT,
      parent: {
        id: 'id_group',
        title: 'Group',
        kind: FieldKindEnum.GROUP
      }
    },
    // Group end
    {
      id: 'id_date',
      title: 'Date',
      kind: FieldKindEnum.DATE
    }
  ]
  const _logics: Logic[] = [
    {
      fieldId: 'id_short_text',
      payloads: [
        {
          id: 'p1',
          condition: {
            comparison: ComparisonEnum.CONTAINS,
            expected: 'kitty'
          },
          action: {
            kind: ActionEnum.NAVIGATE,
            fieldId: 'id_number'
          }
        }
      ]
    }
  ]

  const result = applyLogicToFields(_fields, _logics, undefined, {
    id_short_text: 'hello kitty'
  })
  expect(result.fields.map(f => f.id)).toStrictEqual(
    _fields.filter(f => f.id !== 'id_statement').map(f => f.id)
  )
  expect(result.fields).toMatchSnapshot()

  const result2 = applyLogicToFields(_fields, _logics, undefined, {
    id_short_text: 'hello world'
  })
  expect(result2.fields[0].isTouched).toBe(true)

  const result3 = applyLogicToFields(_fields, _logics, undefined, {
    id_short_text: undefined
  })
  expect(result3.fields[0].isTouched).toBe(false)

  const result4 = applyLogicToFields(_fields, _logics, undefined, {
    id_short_text: ''
  })
  expect(result4.fields[0].isTouched).toBe(false)
})

test('apply to fields with thank you page', () => {
  const fields: FormField[] = [
    {
      id: 'id_short_text',
      title: 'Short Text',
      kind: FieldKindEnum.SHORT_TEXT
    },
    {
      id: 'id_statement',
      title: 'Statement',
      kind: FieldKindEnum.STATEMENT
    },
    {
      id: 'id_thank_you',
      title: 'Thank You',
      kind: FieldKindEnum.THANK_YOU
    }
  ]

  const logics: Logic[] = [
    {
      fieldId: 'id_short_text',
      payloads: [
        {
          id: 'p1',
          condition: {
            comparison: ComparisonEnum.CONTAINS,
            expected: 'kitty'
          },
          action: {
            kind: ActionEnum.NAVIGATE,
            fieldId: 'id_thank_you'
          }
        }
      ]
    }
  ]

  const result = applyLogicToFields(fields, logics, undefined, {
    id_short_text: 'hello kitty'
  })

  expect(result.fields.length).toBe(1)
  expect(result.fields[0].id).toBe(fields[0].id)
})
