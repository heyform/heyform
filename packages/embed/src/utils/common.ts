import parse from 'color-parse'

import { AnyMap } from '@/type'

const USER_AGENT = window.navigator.userAgent

export const isMobile = /Android|iPhone/i.test(USER_AGENT)

const toString = Object.prototype.toString

export function getType(obj: any): string {
  if (obj === null) {
    return 'null'
  }

  let type: string = typeof obj

  if (type !== 'object') {
    return type
  }

  type = toString.call(obj).slice(8, -1)

  const typeLower = type.toLowerCase()

  if (typeLower !== 'object') {
    if (typeLower === 'number' || typeLower === 'boolean' || typeLower === 'string') {
      return type
    }
  }

  return typeLower
}

export function isType(value: unknown, type: string) {
  return getType(value) === type
}

export function isObject(value: unknown): boolean {
  return isType(value, 'object')
}

export function isPlainObject(value: unknown): boolean {
  if (!isObject(value)) {
    return false
  }

  const ctor = (value as object).constructor

  if (typeof ctor !== 'function') {
    return false
  }

  const proto = ctor.prototype

  if (!isObject(proto)) {
    return false
  }

  return proto.hasOwnProperty('isPrototypeOf')
}

export const isArray = Array.isArray

export function buildUrl(url: string, params: AnyMap) {
  const searchParams = new URLSearchParams()

  for (const key in params) {
    searchParams.append(key, params[key])
  }

  return url + (url.includes('?') ? '&' : '?') + searchParams.toString()
}

export function colorIsDark(color: string) {
  const { values, alpha } = parse(color)

  return (alpha * (values[0] * 299 + values[1] * 587 + values[2] * 114)) / 1000 < 150
}

const LOGGER_CONTEXT = '[📄 HeyForm Embed process.env.npm_package_version]'

export const logger = {
  info: (...args: any[]) => {
    console.log(LOGGER_CONTEXT, ...args)
  },
  warn: (...args: any[]) => {
    console.warn(LOGGER_CONTEXT, ...args)
  },
  error: (...args: any[]) => {
    console.error(LOGGER_CONTEXT, ...args)
  }
}
