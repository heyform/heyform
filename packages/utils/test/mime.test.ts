import { test, expect } from 'vitest'
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

test('mime', () => {
  const configs = [
    // Bare extension
    { input: 'txt', expected: 'text/plain' },
    { input: '.txt', expected: 'text/plain' },
    { input: '.bogus', expected: undefined },
    { input: 'bogus', expected: undefined },

    // File paths
    { input: 'dir/text.txt', expected: 'text/plain' },
    { input: 'dir\\text.txt', expected: 'text/plain' },
    { input: '.text.txt', expected: 'text/plain' },
    { input: '.txt', expected: 'text/plain' },
    { input: 'txt', expected: 'text/plain' },
    { input: '/path/to/page.html', expected: 'text/html' },
    { input: 'c:\\path\\to\\page.html', expected: 'text/html' },
    { input: 'page.html', expected: 'text/html' },
    { input: 'path/to/page.html', expected: 'text/html' },
    { input: 'path\\to\\page.html', expected: 'text/html' },
    { input: '/txt', expected: undefined },
    { input: '\\txt', expected: undefined },
    { input: 'text.nope', expected: undefined },
    { input: '/path/to/file.bogus', expected: undefined },
    { input: '/path/to/json', expected: undefined },
    { input: '/path/to/.json', expected: undefined },
    { input: '/path/to/.config.json', expected: 'application/json' },
    { input: '.config.json', expected: 'application/json' },

    // Non-sensical
    { input: null, expected: undefined },
    { input: undefined, expected: undefined },
    { input: 42, expected: undefined },
    { input: {}, expected: undefined },
  ]

  configs.forEach(row => {
    expect(mime(row.input as any)).toBe(row.expected)
  })
})