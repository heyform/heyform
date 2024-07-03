import { test, expect } from 'vitest'
import { date, datePeriod, isDateExpired, timestamp, unixDiff } from '../src'

test('unix timestamp', () => {
  expect(date().unix()).toBe(timestamp())
})

test('date expired', () => {
  const startAt = date('2020-05-05').unix()
  const endAt = date('2020-05-15').unix()
  expect(isDateExpired(startAt, endAt, '5d')).toBe(true)
})

test('date not expired', () => {
  const startAt = date('2020-05-05').unix()
  const endAt = date('2020-05-10').unix()
  expect(isDateExpired(startAt, endAt, '10d')).toBe(false)
})

test('to 5 days', () => {
  const startAt = date('2020-05-05 12:00:00').unix()
  const endAt = date('2020-05-10 12:00:00').unix()
  expect(unixDiff(startAt, endAt)).toBe(5)
})

test('to zero days', () => {
  const startAt = date('2020-10-10').unix()
  const endAt = date('2020-05-05').unix()
  expect(unixDiff(startAt, endAt)).toBe(0)
})

test('date period', () => {
  const startAt = date('2020-10-10 12:00:00').unix()
  expect(datePeriod(startAt, 2, 'day')).toBe(date('2020-10-12 12:00:00').unix())
})

test('date period with default params', () => {
  const startAt = date('2020-10-10 12:00:00').unix()
  expect(datePeriod(startAt)).toBe(date('2020-11-10 12:00:00').unix())
})
