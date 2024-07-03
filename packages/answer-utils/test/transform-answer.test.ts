import { test, expect } from 'vitest'
import {
  answersToApiObject,
  answersToHtml,
  answersToJson,
  answersToPlain,
  fieldValuesToAnswers
} from '../src'
import fields from './fixtures/fields.json'
import values from './fixtures/values.json'

const answers = fieldValuesToAnswers(fields as any, values)

test('should convert value to text', () => {
  expect(answersToPlain(answers)).toMatchSnapshot()
})

test('should convert value to html', () => {
  expect(answersToHtml(answers)).toMatchSnapshot()
})

test('should convert value to api object', () => {
  expect(answersToApiObject(answers)).toMatchSnapshot()
})

test('should convert value to json', () => {
  expect(answersToJson(answers)).toMatchSnapshot()
})

test('should convert value to flat json', () => {
  expect(answersToJson(answers, { plain: true })).toMatchSnapshot()
})
