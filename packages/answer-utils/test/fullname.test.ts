import { test, expect } from 'vitest'
import { fieldValuesToAnswers, answersToHtml, answersToPlain } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const field = {
  id: 'FULL_NAME',
  title: 'full_name.test',
  kind: FieldKindEnum.FULL_NAME
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
      FULL_NAME: {
        firstName: 'firstName',
        lastName: 'lastName'
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
      FULL_NAME: {}
    })
  }).toThrow('Please enter first name')
})

test('invalid value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      FULL_NAME: {
        firstName: 'firstName'
      }
    })
  }).toThrow('Please enter last name')
})

test('transform full name to text', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: { required: true }
      }
    ],
    {
      FULL_NAME: {
        firstName: 'firstName',
        lastName: 'lastName'
      }
    }
  )
  expect(answersToPlain(answer)).toMatchSnapshot()
})

test('transform full name to html', () => {
  const answer = fieldValuesToAnswers(
    [
      {
        ...field,
        validations: { required: true }
      }
    ],
    {
      FULL_NAME: {
        firstName: 'firstName',
        lastName: 'lastName'
      }
    }
  )
  expect(answersToHtml(answer)).toMatchSnapshot()
})
