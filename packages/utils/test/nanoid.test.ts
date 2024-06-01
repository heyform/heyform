import { nanoid, nanoidCustomAlphabet } from '../src'

test('nanoid length', () => {
  expect(nanoid().length).toBe(21)
})

test('nanoid custom alphabet', () => {
  expect(nanoidCustomAlphabet('a', 6)).toBe('aaaaaa')
  expect(nanoidCustomAlphabet('b')).toBe('bbbbbbbbbbbbbbbbbbbbb')
})
