// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { DateInput } from '../src/components/DateInput'
import { DateRangeInput } from '../src/components/DateRangeInput'
import { initI18n } from '../src/i18n'
import { getLRU, getStorage, removeStorage } from '../src/store'

const formId = 'date-input-restoration'
const fieldId = 'question'

beforeEach(() => {
  initI18n()
})

afterEach(() => {
  removeStorage(formId)
})

test('restores a numeric answer after the same question changes to a date', () => {
  getLRU().put(formId, { [fieldId]: 42 })

  const values = getStorage(formId, true)
  expect(values[fieldId]).toBe(42)

  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(
    <DateInput value={values[fieldId]} format="DD/MM/YYYY" />
  )

  expect(Array.from(container.querySelectorAll('input'), input => input.value)).toEqual([
    '',
    '',
    ''
  ])
})

test.each([
  { name: 'numeric answer', value: 42, expected: ['', '', '', '', '', ''] },
  {
    name: 'numeric start',
    value: { start: 42, end: '25/03/2024' },
    expected: ['', '', '', '25', '03', '2024']
  },
  {
    name: 'numeric end',
    value: { start: '25/03/2024', end: 42 },
    expected: ['25', '03', '2024', '', '', '']
  }
])('restores a date range with a $name', ({ value, expected }) => {
  getLRU().put(formId, { [fieldId]: value })

  const values = getStorage(formId, true)
  expect(values[fieldId]).toEqual(value)

  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(
    <DateRangeInput value={values[fieldId]} format="DD/MM/YYYY" />
  )

  expect(Array.from(container.querySelectorAll('input'), input => input.value)).toEqual(expected)
})
