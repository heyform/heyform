import { mime, commonImageMimeTypes, commonFileMimeTypes } from '../src'

test('image mime type', () => {
  expect(mime('.jpg')).toBe('image/jpeg')
})

test('common image mime type', () => {
  expect(commonImageMimeTypes).toMatchSnapshot()
})

test('common file mime type', () => {
  expect(commonFileMimeTypes).toMatchSnapshot()
})
