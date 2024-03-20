import { clone } from '../src'

const obj = {
  a: {
    w: 'hello'
  },
  b: [
    {
      x: 2,
      y: true
    }
  ]
}

test('clone nested object', () => {
  expect(clone(obj)).toStrictEqual(obj)
})

test('clone nested object', () => {
  const copyObj = clone(obj)
  copyObj.a.w = 'world'

  expect(obj.a.w).toBe('hello')
  expect(copyObj.a.w).toBe('world')
  expect(copyObj.b).toStrictEqual([
    {
      x: 2,
      y: true
    }
  ])
})
