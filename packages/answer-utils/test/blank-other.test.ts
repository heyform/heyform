import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import { describe, expect, test } from 'vitest'

import {
  answersToApiObject,
  answersToHtml,
  answersToJson,
  answersToPlain,
  fieldValuesToAnswers,
  otherChoiceText,
  validateFields
} from '../src'

function choice(properties: Record<string, unknown> = {}, required = true): FormField {
  return {
    id: 'role',
    title: 'Role',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    validations: { required },
    properties: {
      choices: [
        { id: 'motion', label: 'Motion' },
        { id: 'director', label: 'Director' }
      ],
      allowOther: true,
      ...properties
    }
  }
}

const blank = { role: { value: [], other: '' } }

describe('blank "Other"', () => {
  test('is an answer only when the question allows it', () => {
    for (const required of [true, false]) {
      expect(() =>
        validateFields([choice({ allowBlankOther: true }, required)], blank as any)
      ).not.toThrow()
      expect(() => validateFields([choice({}, required)], blank as any)).toThrow(
        'This field is required'
      )
      expect(() =>
        validateFields([choice({ allowBlankOther: false }, required)], blank as any)
      ).toThrow()
    }

    // allowBlankOther does nothing once "Other" itself is off.
    expect(() =>
      validateFields([choice({ allowOther: false, allowBlankOther: true })], blank as any)
    ).toThrow('This field is required')
  })

  test('counts as one choice', () => {
    const field = choice({ allowBlankOther: true, allowMultiple: true })
    field.validations = { required: true, min: 2, max: 2 }

    expect(() =>
      validateFields([field], { role: { value: ['motion'], other: '' } } as any)
    ).not.toThrow()
    expect(() => validateFields([field], blank as any)).toThrow()
    // Single-select still can't combine an option with "Other".
    expect(() =>
      validateFields([choice({ allowBlankOther: true })], {
        role: { value: ['motion'], other: '' }
      } as any)
    ).toThrow('Multiple choose is not allowed')
  })

  test('keeps the empty string in the stored answer', () => {
    const [answer] = fieldValuesToAnswers([choice({ allowBlankOther: true })], blank as any)
    expect(answer.value).toEqual({ value: [], other: '' })
  })

  test('reads as "Other" wherever answers are rendered', () => {
    const [answer] = fieldValuesToAnswers([choice({ allowBlankOther: true })], blank as any)

    const allowed = { allowOther: true, allowBlankOther: true }
    expect(otherChoiceText('', allowed)).toBe('Other')
    expect(otherChoiceText('Producer', allowed)).toBe('Producer')
    expect(otherChoiceText(undefined, allowed)).toBeUndefined()
    expect(otherChoiceText(null, allowed)).toBeUndefined()

    expect(answersToPlain([answer])).toContain('Other')
    expect(answersToHtml([answer])).toContain('Other')
    expect(Object.values(answersToApiObject([answer]))).toEqual(['Other'])
    expect(JSON.stringify(answersToJson([answer]))).toContain('"Other"')

    const [typed] = fieldValuesToAnswers([choice({ allowMultiple: true })], {
      role: { value: ['motion'], other: 'Producer' }
    } as any)
    expect(Object.values(answersToApiObject([typed]))).toEqual(['Motion, Producer'])
  })

  test('only reads a blank "Other" as an answer where the question allows it', () => {
    expect(otherChoiceText('')).toBeUndefined()
    expect(otherChoiceText('', { allowOther: true })).toBeUndefined()
    expect(otherChoiceText('', { allowBlankOther: true })).toBeUndefined()
    expect(otherChoiceText('Producer')).toBe('Producer')
  })

  test('drops a blank "Other" sent to a question without "Other"', () => {
    const [answer] = fieldValuesToAnswers([choice({ allowOther: false })], {
      role: { value: ['motion'], other: '' }
    } as any)

    expect(answer.value).toEqual({ value: ['motion'] })
    expect(answersToPlain([answer])).not.toContain('Other')
  })
})
