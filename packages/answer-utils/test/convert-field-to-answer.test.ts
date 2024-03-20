import { fieldValuesToAnswers } from '../src'
import fields from './fixtures/fields.json'
import values from './fixtures/values.json'

test('should convert value to answer', () => {
  expect(fieldValuesToAnswers(fields as any, values)).toMatchSnapshot()
})

test('should convert partial submission value to answer', () => {
  expect(
    fieldValuesToAnswers(
      fields as any,
      {
        ...values,
        MVlZfnmjZlye: undefined
      },
      true
    )
  ).toMatchSnapshot()
})

test('should throw error with empty multiple choice', () => {
  expect(() => {
    fieldValuesToAnswers(fields as any, {
      yLxkSvkN7u2N: ''
    })
  }).toThrow('This field is required')
})
