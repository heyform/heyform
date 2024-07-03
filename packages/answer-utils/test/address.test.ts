import { test, expect } from 'vitest'
import { fieldValuesToAnswers } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const field = {
  id: 'ADDRESS',
  title: 'address.test',
  kind: FieldKindEnum.ADDRESS
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
      ADDRESS: {
        address1: 'address1',
        city: 'city',
        state: 'state',
        zip: 'zip',
        country: 'country'
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
      ADDRESS: {}
    })
  }).toThrow('Please enter address1')
})

test('invalid value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      ADDRESS: {
        address1: 'address1',
        city: 'city',
        state: 'state',
        zip: 'zip'
      }
    })
  }).toThrow('Please select country')
})
