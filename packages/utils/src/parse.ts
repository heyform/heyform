import * as helper from './helper'

export function parseJson(str: string, defaultValue?: any): any {
  let value: any

  try {
    value = JSON.parse(str)
  } catch (e) {
    // eslint-disable-line
  }

  if (defaultValue && !value) {
    value = defaultValue
  }

  return value
}

export function parseBool(arg: any, defaultValue?: boolean): boolean {
  if (helper.isEmpty(arg)) {
    return defaultValue || false
  }

  if (helper.isBoolean(arg)) {
    return arg
  }

  return helper.isTrue(arg)
}

export function parseNumber(
  arg: any,
  defaultValue?: number,
  maxValue?: number
): number | undefined {
  if (helper.isNumber(arg)) {
    if (maxValue && maxValue < Number(arg)) {
      return maxValue
    }
    return Number(arg)
  }

  const num = parseInt(arg, 10)

  if (isNaN(num)) {
    return defaultValue
  }

  if (maxValue && maxValue < num) {
    return maxValue
  }

  return num
}

export function htmlToText(html: string, limit = 100) {
  let result = html
    .replace(/<style[^<>]*>((?!<\/).)*<\/style>/gi, '')
    .replace(/<script[^<>]*>((?!<\/).)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\t|\r|\n|\r\n/g, '')
    .replace(/\s+/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  if (limit > 0) {
    result = result.slice(0, limit)
  }

  return result
}
