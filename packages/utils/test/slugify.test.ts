import { slugify } from '../src'

test('slugify', () => {
  expect(slugify('/user/sign/in')).toBe('usersignin')
})
