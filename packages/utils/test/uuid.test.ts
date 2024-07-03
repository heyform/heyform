import { test, expect } from 'vitest'
import { uuidv4, helper } from '../src'

test('uuidv4', () => {
  expect(helper.isUUID(uuidv4())).toBe(true)
})
