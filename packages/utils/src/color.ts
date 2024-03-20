import { isEmpty } from './helper'

const HEX_REGEX = /^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i
const RGBA_REGEX =
  /rgba\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d*(?:\.\d+)?)\)/i
const RGB_REGEX = /rgb\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?)\)/i

export function isHexColor(color: string): boolean {
  return HEX_REGEX.test(color)
}

export function isRgba(color: string): boolean {
  return RGBA_REGEX.test(color)
}

export function isRgb(color: string): boolean {
  return RGB_REGEX.test(color)
}

export function hexToRgb(hex: string): number[] {
  if (isEmpty(hex)) {
    return []
  }

  if (isRgba(hex)) {
    // @ts-ignore
    const [, red, green, blue, alpha] = RGBA_REGEX.exec(hex)
    return [Number(red), Number(green), Number(blue), Number(alpha)]
  }

  if (isRgb(hex)) {
    // @ts-ignore
    const [, red, green, blue] = RGB_REGEX.exec(hex)
    return [Number(red), Number(green), Number(blue), 1]
  }

  if (!isHexColor(hex)) {
    return []
  }

  hex = hex.replace(/^#/, '')

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  let alpha = 1
  if (hex.length === 8) {
    alpha = hexToFloatAlpha(hex.slice(6, 8))
    hex = hex.slice(0, 6)
  }

  const number = Number.parseInt(hex, 16)
  const red = number >> 16
  const green = (number >> 8) & 255
  const blue = number & 255

  return [red, green, blue, alpha]
}

export function isDarkColor(hex: string): boolean {
  if (!isHexColor(hex)) {
    return true
  }
  return colorBrightness(hex) < 170
}

export function isLightColor(hex: string): boolean {
  return !isDarkColor(hex)
}

export function colorBrightness(hex: string): number {
  const [red, green, blue, alpha] = hexToRgb(hex)
  return (alpha * (red * 299 + green * 587 + blue * 114)) / 1000
}

export function rgbToHex([r, g, b]: number[]): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export function alpha(hex: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function lighten(hex: string, alpha: number): string {
  return rgbToHex(alphaHexToRgb(hex, 1 - alpha, '#fff'))
}

export function darken(hex: string, alpha: number): string {
  return rgbToHex(alphaHexToRgb(hex, 1 - alpha, '#010101'))
}

export function invert(hex: string): string {
  const [red, green, blue] = hexToRgb(hex)
  return rgbToHex([255 - red, 255 - green, 255 - blue])
}

/**
 * Convert rgba to a transparency-adjusted-hex
 * https://stackoverflow.com/a/15898886
 */
export function alphaHexToRgb(
  hex: string,
  alpha: number,
  backgroundHex: string
): number[] {
  const hexRgb = hexToRgb(hex)
  const backgroundRgb = hexToRgb(backgroundHex)

  return hexRgb.map((color, index) => {
    return colorRange(
      Math.floor(
        colorRange(color) * alpha +
          colorRange(backgroundRgb[index]) * (1 - alpha)
      )
    )
  })
}

function colorRange(color: number): number {
  return color < 1 ? 1 : color >= 255 ? 255 : color
}

function hexToFloatAlpha(arg: string) {
  const num = parseInt(arg, 16)
  const max = parseInt('0xff', 16)
  return Number((num / max).toFixed(2))
}
