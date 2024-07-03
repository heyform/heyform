import { test, expect } from 'vitest'
import { bytes, formatBytes } from '../src'

test('parse undefined', () => {
  expect(bytes(undefined as unknown as string)).toBe(undefined)
})

test('parse null', () => {
  expect(bytes(null as unknown as string)).toBe(undefined)
})

test('parse empty string', () => {
  expect(bytes(' ')).toBe(undefined)
})

test('parse latin characters', () => {
  expect(bytes('abc')).toBe(undefined)
  expect(bytes('2x')).toBe(undefined)
  expect(bytes('x2')).toBe(undefined)
  expect(bytes('x2x')).toBe(undefined)
})

test('parse 5b', () => {
  expect(bytes('5b')).toBe(5)
})

test('parse 32kb', () => {
  expect(bytes('32kb')).toBe(32 * 1024)
})

test('parse 1.5mb', () => {
  expect(bytes('1.5mb')).toBe(1.5 * 1024 * 1024)
})

test('parse 5gb', () => {
  expect(bytes('5gb')).toBe(5 * 1024 * 1024 * 1024)
})

test('parse 5tb', () => {
  expect(bytes('5tb')).toBe(5 * 1024 * 1024 * 1024 * 1024)
})

test('parse 5pb', () => {
  expect(bytes('5pb')).toBe(5 * 1024 * 1024 * 1024 * 1024 * 1024)
})

test('format 5b', () => {
  expect(formatBytes(5)).toBe('5B')
})

test('format 32kb', () => {
  expect(formatBytes(32 * 1024)).toBe('32KB')
})

test('format 1.5mb', () => {
  expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5MB')
})

test('format 5gb', () => {
  expect(formatBytes(5 * 1024 * 1024 * 1024)).toBe('5GB')
})

test('format 5tb', () => {
  expect(formatBytes(5 * 1024 * 1024 * 1024 * 1024)).toBe('5TB')
})

test('format 5pb', () => {
  expect(formatBytes(5 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('5PB')
})