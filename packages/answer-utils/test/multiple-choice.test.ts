import { fieldValuesToAnswers } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const choices = [
  {
    id: 'id_a',
    label: 'A'
  },
  {
    id: 'id_b',
    label: 'B'
  },
  {
    id: 'id_c',
    label: 'C'
  }
]

const field = {
  id: 'MULTIPLE_CHOICE',
  title: 'multiple-choice.test',
  kind: FieldKindEnum.MULTIPLE_CHOICE,
  properties: {
    choices
  }
}

test('multiple values should be verified', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: {
          required: true
        },
        properties: {
          choices,
          allowMultiple: true
        }
      }
    ],
    {
      MULTIPLE_CHOICE: {
        value: ['id_a', 'id_b']
      }
    }
  )

  expect(answer).toMatchSnapshot()
})

test('single value should be verified', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: {
          required: true
        }
      }
    ],
    {
      MULTIPLE_CHOICE: {
        value: ['id_a']
      }
    }
  )

  expect(answer).toMatchSnapshot()
})

test('undefined value should be verified if not required', () => {
  const value = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: { required: false }
      }
    ],
    {}
  )

  expect(value).toMatchSnapshot()
})

test('empty value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      MULTIPLE_CHOICE: ''
    })
  }).toThrow('This field is required')
})

test('value length greater then 2 should throw error', () => {
  expect(() => {
    fieldValuesToAnswers(
      [
        {
          ...field,
          properties: {
            choices,
            allowMultiple: true
          },
          validations: {
            max: 2
          }
        }
      ],
      {
        MULTIPLE_CHOICE: {
          value: ['id_a', 'id_b', 'id_c']
        }
      }
    )
  }).toThrow('Cannot select non-specified choices')
})

test('multiple values should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      MULTIPLE_CHOICE: {
        value: ['id_a', 'id_b', 'id_c']
      }
    })
  }).toThrow('Multiple choose is not allowed')

  expect(() => {
    fieldValuesToAnswers(
      [
        {
          ...field,
          properties: {
            choices,
            allowOther: true
          }
        }
      ],
      {
        MULTIPLE_CHOICE: {
          value: ['id_a'],
          other: 'Other answer'
        }
      }
    )
  }).toThrow('Multiple choose is not allowed')

  expect(() => {
    fieldValuesToAnswers(
      [
        {
          ...field,
          properties: {
            choices,
            allowOther: true
          }
        }
      ],
      {
        MULTIPLE_CHOICE: {
          value: ['id_C']
        }
      }
    )
  }).toThrow('Cannot select non-specified choices')
})

test('invalid value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      MULTIPLE_CHOICE: {
        value: ['id_Z']
      }
    })
  }).toThrow('Cannot select non-specified choices')
})

test('other value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      MULTIPLE_CHOICE: {
        other: 'Other answer'
      }
    })
  }).toThrow('Other value is not allowed')
})

test('multiple values with other should be verified', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: {
          required: true
        },
        properties: {
          choices,
          allowMultiple: true,
          allowOther: true
        }
      }
    ],
    {
      MULTIPLE_CHOICE: {
        value: ['id_a', 'id_b'],
        other: 'Other answer'
      }
    }
  )

  expect(answer).toMatchSnapshot()
})

test('other value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      MULTIPLE_CHOICE: {
        value: [],
        other: 'Other answer'
      }
    })
  }).toThrow('Other value is not allowed')

  expect(() => {
    fieldValuesToAnswers([field], {
      MULTIPLE_CHOICE: {
        value: ['id_a'],
        other: 'Other answer'
      }
    })
  }).toThrow('Other value is not allowed')
})

test('single value with other should be verified', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: {
          required: true
        },
        properties: {
          choices,
          allowOther: true
        }
      }
    ],
    {
      MULTIPLE_CHOICE: {
        other: 'Other answer'
      }
    }
  )

  expect(answer).toMatchSnapshot()
})
