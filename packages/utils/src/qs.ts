import { isEmpty, isString } from './helper'

interface QsOptions {
  encode?: boolean
  decode?: boolean
  separator?: string
}

export function stringify(
  arg: Record<string, any>,
  options?: QsOptions
): string {
  const arr: string[] = []

  Object.keys(arg).forEach(key => {
    let val = arg[key]

    if (isEmpty(val)) {
      val = ''
    } else {
      val = String(val)
    }

    if (options?.encode) {
      val = encodeURIComponent(val)
    }

    arr.push(`${key}=${val}`)
  })

  return arr.join('&')
}

export function parse(str: string, options?: QsOptions): Record<string, any> {
  const obj: Record<string, any> = {}

  if (!isString(str)) {
    return obj
  }

  const arr = str.replace(/^([^?]+)?\?/, '').split('&')

  arr.forEach(param => {
    const paramArr = param.split('=')
    const key = paramArr[0]

    if (!isEmpty(key)) {
      let val: any = paramArr[1]

      if (options?.decode) {
        val = decodeURIComponent(val)
      }

      val =
        options?.separator && val.includes(options?.separator)
          ? val.split(options?.separator)
          : val

      obj[key] = val
    }
  })

  return obj
}

export default {
  stringify,
  parse
}
