import { IParseOptions, IStringifyOptions, parse, stringify } from 'qs'
import {
  isEmpty,
  isBoolean,
  isTrue,
  isNumber,
  isValid,
  isString
} from './helper'

export function toBool(value: unknown, defaults?: boolean): boolean {
  if (isEmpty(value)) {
    return defaults || false
  }

  if (isBoolean(value)) {
    return value as boolean
  }

  return isTrue(value)
}

export const parseBool = toBool

export function toInteger(
  value: unknown,
  defaults?: number,
  maxValue?: number
): number | undefined {
  let val: number

  if (isNumber(value)) {
    val = Number(value)
  } else {
    val = parseInt(value as string, 10)
  }

  if (!isFinite(val)) {
    return defaults
  }

  return maxValue ? Math.min(maxValue, val) : val
}

export const parseNumber = toInteger
export const toInt = toInteger

export function toFloat(
  value: unknown,
  defaults?: number,
  maxValue?: number
): number | undefined {
  let val: number

  if (isNumber(value)) {
    val = Number(value)
  } else {
    val = parseFloat(value as string)
  }

  if (!isFinite(val)) {
    return defaults
  }

  return maxValue ? Math.min(maxValue, val) : val
}

export function toFixed(value: number, precision = 2) {
  return value.toFixed(precision).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export function toJSON<T extends object>(
  str: unknown,
  defaults?: T
): T | undefined {
  let value: T | undefined

  if (isValid(str) && isString(str)) {
    try {
      value = JSON.parse(str as string)
    } catch (e) {
      // eslint-disable-line
    }
  }

  if (!!defaults && !value) {
    value = defaults
  }

  return value
}

export const parseJson = toJSON

const THOUSAND = 1_000
const HUNDRED_THOUSAND = 100_000
const MILLION = 1_000_000
const HUNDRED_MILLION = 100_000_000
const BILLION = 1_000_000_000
const HUNDRED_BILLION = 100_000_000_000
const TRILLION = 1_000_000_000_000

export function toIntlNumber(value: number) {
  if (value >= THOUSAND && value < MILLION) {
    const thousands = value / THOUSAND

    if (thousands === Math.floor(thousands) || value >= HUNDRED_THOUSAND) {
      return Math.floor(thousands) + 'K'
    } else {
      return Math.floor(thousands * 10) / 10 + 'K'
    }
  } else if (value >= MILLION && value < BILLION) {
    const millions = value / MILLION

    if (millions === Math.floor(millions) || value >= HUNDRED_MILLION) {
      return Math.floor(millions) + 'M'
    } else {
      return Math.floor(millions * 10) / 10 + 'M'
    }
  } else if (value >= BILLION && value < TRILLION) {
    const billions = value / BILLION

    if (billions === Math.floor(billions) || value >= HUNDRED_BILLION) {
      return Math.floor(billions) + 'B'
    } else {
      return Math.floor(billions * 10) / 10 + 'B'
    }
  } else {
    return `${value}`
  }
}

interface ToDurationOptions {
  hideOnZeroValue?: boolean
  padNumber?: boolean
  hourUnit?: string
  minuteUnit?: string
  secondUnit?: string
}

function durationPad(num: number, size: number) {
  return ('000' + num).slice(size * -1)
}

function getDuration(num: number, unit: string, options?: ToDurationOptions) {
  if (options?.hideOnZeroValue && num === 0) {
    return
  }

  if (options?.padNumber) {
    return durationPad(num, 2) + unit
  }

  return num + unit
}

export function toDuration(value: number, options?: ToDurationOptions) {
  const hours = Math.floor(value / 60 / 60)
  const minutes = Math.floor(value / 60) % 60
  const seconds = Math.floor(value - minutes * 60 - hours * 60 * 60)

  return [
    hours > 0 ? { num: hours, unit: options?.hourUnit || 'h' } : null,
    minutes > 0 ? { num: minutes, unit: options?.minuteUnit || 'm' } : null,
    { num: seconds, unit: options?.secondUnit || 's' }
  ]
    .filter(Boolean)
    .map((d, i) =>
      getDuration(d!.num, d!.unit, {
        ...options,
        hideOnZeroValue: i === 0 ? false : options?.hideOnZeroValue
      })
    )
    .filter(Boolean)
    .join(' ')
}

export function toURLParams<T extends object>(
  value: string,
  options?: IParseOptions
) {
  return parse(value, options) as T
}

export function toURLQuery(
  value: Record<string | number, any>,
  baseUri?: string,
  options?: IStringifyOptions
) {
  const query = stringify(value, options)

  if (baseUri) {
    return baseUri + (baseUri.includes('?') ? '&' : '?') + query
  }

  return query
}
