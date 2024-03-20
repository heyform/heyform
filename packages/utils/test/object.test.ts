import {
  pickObject,
  pickValidValues,
  removeObjectNil,
  copyObjectValues
} from '../src'

const obj = {
  a: null,
  b: undefined,
  c: 'hello',
  d: [1, 2, 3],
  nan: parseInt('nan')
}

test("remove object's nil fields", () => {
  expect(removeObjectNil(obj)).toStrictEqual({
    c: 'hello',
    d: [1, 2, 3]
  })
})

test('remove nil fields from non object', () => {
  expect(removeObjectNil([] as any)).toStrictEqual({})
})

test('pick fields from object', () => {
  expect(pickObject(obj, ['c', 'd'])).toStrictEqual({
    c: 'hello',
    d: [1, 2, 3]
  })
})

test('pick fields with alias from object', () => {
  expect(pickObject(obj, ['c', ['d', 'list']])).toStrictEqual({
    c: 'hello',
    list: [1, 2, 3]
  })
})

test('pick fields from object with excludes', () => {
  expect(pickObject(obj, [], ['a', 'b', 'nan'])).toStrictEqual({
    c: 'hello',
    d: [1, 2, 3]
  })
})

test('pick fields from non object', () => {
  expect(pickObject([] as any, ['c'])).toStrictEqual({})
})

test('pick plain object', () => {
  expect(pickValidValues(obj, ['a', 'b', ['c', 'c.0']])).toStrictEqual({
    'c.0': 'hello'
  })
})

test('copy values to dist object', () => {
  const dist = {
    j: 'world'
  }

  copyObjectValues(
    {
      ...obj,
      e: {
        e1: 'hello'
      }
    },
    dist,
    ['a', ['b', 'b.c'], ['c', 'c.d'], ['e.e1', 'k'], 'd']
  )

  expect(dist).toStrictEqual({
    c: {
      d: 'hello'
    },
    d: [1, 2, 3],
    k: 'hello',
    j: 'world'
  })
  expect(dist === dist).toBe(true)
})
