import { toBool } from '../src'

test('bool', () => {
  expect(toBool(null)).toBe(false)
  expect(toBool(null, true)).toBe(true)
  expect(toBool(1)).toBe(true)
  expect(toBool('1')).toBe(true)
  expect(toBool(true)).toBe(true)
  expect(toBool(0)).toBe(false)
  expect(toBool('0')).toBe(false)
  expect(toBool(false)).toBe(false)
})
