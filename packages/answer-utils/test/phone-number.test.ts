import { test, expect } from 'vitest'
import { fieldValuesToAnswers } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const field = {
  id: 'PHONE_NUMBER',
  title: 'phone-number.test',
  kind: FieldKindEnum.PHONE_NUMBER
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
      PHONE_NUMBER: '+12015550123'
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
      PHONE_NUMBER: ''
    })
  }).toThrow('Please enter a valid mobile phone number')
})

test('invalid value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      PHONE_NUMBER: '+62015550123'
    })
  }).toThrow('Please enter a valid mobile phone number')
})
