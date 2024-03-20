import { random, RandomType } from '../src'

const len = 6

test('alphanumeric', () => {
  const str = random(len)
  expect(str).toHaveLength(len)
})

test('upper string', () => {
  const str = random(len, RandomType.UPPER)
  expect(/^[A-Z]{6}$/.test(str)).toBe(true)
})

test('lower string', () => {
  const str = random(len, RandomType.LOWER)
  expect(/^[a-z]{6}$/.test(str)).toBe(true)
})

test('lower numeric string', () => {
  const str = random(len, RandomType.LOWER_NUMERIC)
  expect(/^[0-9a-z]{6}$/.test(str)).toBe(true)
})

test('upper numeric string', () => {
  const str = random(len, RandomType.UPPER_NUMERIC)
  expect(/^[0-9A-Z]{6}$/.test(str)).toBe(true)
})

test('number', () => {
  const str = random(len, RandomType.NUMERIC)
  expect(/^[0-9]{6}$/.test(str)).toBe(true)
})

test('hex string', () => {
  const str = random(len, RandomType.HEXIC)
  expect(/^[0-9a-f]{6}$/.test(str)).toBe(true)
})
