import {
  alpha,
  darken,
  hexToRgb,
  invert,
  isDarkColor,
  isLightColor,
  lighten,
  rgbToHex
} from '../src'

test('invalid hex', () => {
  expect(hexToRgb('invalid')).toStrictEqual([])
})

test('rgba(255,255, 255, 0.1) to rgb', () => {
  expect(hexToRgb('rgba(255,255,255,0.1)')).toStrictEqual([255, 255, 255, 0.1])
})

test('rgb(255,255,255) to rgb', () => {
  expect(hexToRgb('rgb(255,255, 255)')).toStrictEqual([255, 255, 255, 1])
})

test('#800080 to rgb', () => {
  expect(hexToRgb('#80008080')).toStrictEqual([128, 0, 128, 0.5])
})

test('#fff to rgb', () => {
  expect(hexToRgb('#fff')).toStrictEqual([255, 255, 255, 1])
})

test('rgb(255, 255, 153) to hex', () => {
  expect(rgbToHex([255, 255, 153])).toStrictEqual('#ffff99')
})

test('rgb(17, 17, 123) to hex', () => {
  expect(rgbToHex([17, 17, 123])).toStrictEqual('#11117b')
})

test('alpha #fff', () => {
  expect(alpha('#fff', 0.5)).toBe('rgba(255, 255, 255, 0.5)')
})

test('alpha #000', () => {
  expect(alpha('#000', 0.1)).toBe('rgba(0, 0, 0, 0.1)')
})

test('alpha #EB5757', () => {
  expect(alpha('#EB5757', 0.1)).toBe('rgba(235, 87, 87, 0.1)')
})

test('lighten #000', () => {
  expect(lighten('#000', 0.1)).toBe('#1a1a1a')
})

test('darken #106bf3', () => {
  expect(darken('#106bf3', 0.1)).toBe('#0e60da')
})

test('darken #999', () => {
  expect(darken('#999', 0.5)).toBe('#4d4d4d')
})

test('#000 is dark color', () => {
  expect(isDarkColor('#000')).toBe(true)
})

test('helloworld is dark color', () => {
  expect(isDarkColor('helloworld')).toBe(true)
})

test('#106bf3 is dark color', () => {
  expect(isDarkColor('#106bf3')).toBe(true)
})

test('#000000F7 is dark color', () => {
  expect(isDarkColor('#000000F7')).toBe(true)
})

test('#ffff99 is light color', () => {
  expect(isLightColor('#ffff99')).toBe(true)
})

test('#fff is light color', () => {
  expect(isLightColor('#fff')).toBe(true)
})

test('invert #000 to #ffffff', () => {
  expect(invert('#000')).toBe('#ffffff')
})

test('invert #ffff99 to #000066', () => {
  expect(invert('#ffff99')).toBe('#000066')
})

test('invert #106bf3 to #ef940c', () => {
  expect(invert('#106bf3')).toBe('#ef940c')
})

test('invert #fff to #000000', () => {
  expect(invert('#fff')).toBe('#000000')
})
