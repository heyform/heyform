import { slugify } from '../src'

test('slugify', () => {
  expect(slugify('/user/sign/in')).toBe('usersignin')
  expect(slugify('Hello World')).toBe('hello_world')
  expect(slugify('Hello World', { replacement: '-' })).toBe('hello-world')
})
