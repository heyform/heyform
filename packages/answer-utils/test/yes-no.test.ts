import { fieldValuesToAnswers } from '../src'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

const field = {
  id: 'YES_NO',
  title: 'yes-no.test',
  kind: FieldKindEnum.YES_NO,
  properties: {
    choices: [
      {
        id: 'id_yes',
        label: 'Yes'
      },
      {
        id: 'id_no',
        label: 'No'
      }
    ]
  }
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
      YES_NO: 'id_yes'
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
      YES_NO: ''
    })
  }).toThrow('Please choose you choice')
})

test('invalid value should throw error', () => {
  expect(() => {
    fieldValuesToAnswers([field], {
      YES_NO: 'no'
    })
  }).toThrow('Please choose you choice')
})
