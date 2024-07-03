import { test, expect } from 'vitest'
import { isDate } from '../src/helper'

const validDates = [
  ['2000-02-13', 'YYYY-MM-DD'],
  ['13/2/2000', 'DD/MM/YYYY'],
  ['2.13.2000', 'MM.DD.YYYY'],
  ['1900-4-1 08:30', 'YYYY-MM-DD HH:mm'],
  ['13/2/2000 16:30', 'DD/MM/YYYY HH:mm'],
  ['2.13.2000 16:30', 'MM.DD.YYYY HH:mm']
]

const invalidDates = [
  ['2.30.2000', 'MM.DD.YYYY'],
  ['1700-12-30', 'YYYY-DD-MM'],
  ['2000-11-31', 'YYYY-MM-DD'],
  ['2000-4-34', 'YYYY-MM-DD'],
  ['2000-02-13 12:30', 'YYYY-MM-DD mm:HH'],
  ['2000-02-13 80:30', 'YYYY-MM-DD HH:mm']
]

test('valid dates', () => {
  validDates.forEach(([date, format]) => {
    expect(isDate(date, format)).toBe(true)
  })
})

test('invalid date', () => {
  invalidDates.forEach(([date, format]) => {
    expect(isDate(date, format)).toBe(false)
  })
})
