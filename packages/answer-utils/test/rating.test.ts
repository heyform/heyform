import { test, expect } from 'vitest'
import { fieldValuesToAnswers } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const field = {
  id: 'RATING',
  title: 'rating.test',
  kind: FieldKindEnum.RATING,
  properties: {
    total: 10
  }
}

test('correct value should be verified', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: { required: true },
        properties: {
          total: 10
        }
      }
    ],
    {
      RATING: 5
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
      RATING: 7
    }
  )

  expect(value).toMatchSnapshot()
})

test('empty value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      RATING: ''
    })
  }).toThrow('Rating value must be number')
})

test('invalid number value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      RATING: 'N5'
    })
  }).toThrow('Rating value must be number')
})

test('should throw error if value length greater then 10', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      RATING: 11
    })
  }).toThrow('Rating value must be number')
})
