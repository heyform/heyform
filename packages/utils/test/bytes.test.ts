import { bytes } from '../src'

test('parse 5b', () => {
  expect(bytes('5b')).toBe(5)
})

test('parse 32kb', () => {
  expect(bytes('32kb')).toBe(32 * 1024)
})

test('parse 1.5mb', () => {
  expect(bytes('1.5mb')).toBe(1.5 * 1024 * 1024)
})

test('parse 5gb', () => {
  expect(bytes('5gb')).toBe(5 * 1024 * 1024 * 1024)
})
