import { qs } from '../src'

const obj = {
  a: [1, 2, 3],
  b: 'hello',
  c: true,
  d: undefined
}

const str = 'a%5B0%5D=1&a%5B1%5D=2&a%5B2%5D=3&b=hello&c=true'

test('stringify object', () => {
  expect(qs.stringify(obj)).toBe(str)
})

test('parse string', () => {
  expect(qs.parse(str)).toStrictEqual({
    a: ['1', '2', '3'],
    b: 'hello',
    c: 'true'
  })
})

test('parse array', () => {
  expect(qs.parse([] as any)).toStrictEqual({})
})

test('parse empty string', () => {
  expect(qs.parse('')).toStrictEqual({})
})
