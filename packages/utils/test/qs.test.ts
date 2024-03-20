import qs from '../src/qs'

const obj = {
  a: [1, 2, 3],
  b: 'hello',
  c: true,
  d: undefined
}

const str = 'a=1,2,3&b=hello&c=true&d='

test('stringify object', () => {
  expect(qs.stringify(obj)).toBe(str)
})

test('parse string', () => {
  expect(qs.parse(str)).toStrictEqual({
    a: '1,2,3',
    b: 'hello',
    c: 'true',
    d: ''
  })
})

test('parse array', () => {
  expect(qs.parse([] as any)).toStrictEqual({})
})

test('parse empty string', () => {
  expect(qs.parse('')).toStrictEqual({})
})
