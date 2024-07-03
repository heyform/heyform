import { test, expect } from 'vitest'
import { fieldValuesToAnswers } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const field = {
  id: 'SHORT_TEXT',
  title: 'short-text.test',
  kind: FieldKindEnum.SHORT_TEXT
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
      SHORT_TEXT: 'hello world'
    }
  )

  expect(answer).toMatchSnapshot()
})

test('empty value should be verified if not required', () => {
  const value = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: { required: false }
      }
    ],
    {
      SHORT_TEXT: ''
    }
  )

  expect(value).toMatchSnapshot()
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

test('should be verified if value length greater then 5', () => {
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
      SHORT_TEXT: 'hello world'
    }
  )

  expect(value).toMatchSnapshot()
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
        SHORT_TEXT: 'hello'
      }
    )
  }).toThrow('The text length must be between 10 to undefined')
})
