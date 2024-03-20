import { fieldValuesToAnswers } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const field = {
  id: 'NUMBER',
  title: 'number.test',
  kind: FieldKindEnum.NUMBER
}

test('correct value should be verified', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: { required: true }
      }
    ],
    {
      NUMBER: 5
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

test('should be verified if value greater then 5', () => {
  const value = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: {
          min: 5
        }
      }
    ],
    {
      NUMBER: 7
    }
  )

  expect(value).toMatchSnapshot()
})

test('empty value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      NUMBER: ''
    })
  }).toThrow('This field should be a number')
})

test('invalid number value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      NUMBER: 'N5'
    })
  }).toThrow('This field should be a number')
})

test('should throw error if value length less then 10', () => {
  expect(() => {
    fieldValuesToAnswers(
      [
        {
          ...field,
          validations: {
            min: 10
          }
        }
      ],
      {
        NUMBER: 5
      }
    )
  }).toThrow('The number must be between 10 to undefined')
})
