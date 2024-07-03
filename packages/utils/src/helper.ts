import _isUUID from 'validator/lib/isUUID'
import _isFQDN from 'validator/lib/isFQDN'
import {
  default as _isNumeric,
  IsNumericOptions
} from 'validator/lib/isNumeric'
import { default as _isEmail, IsEmailOptions } from 'validator/lib/isEmail'
import { default as _isURL, IsURLOptions } from 'validator/lib/isURL'

import { type } from './type'

/* @ts-ignore */
const whiteSpaceRegx =
  /^[\s\f\n\r\t\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff\x09\x0a\x0b\x0c\x0d\x20\xa0]+$/

export const isUUID = _isUUID
export const isFQDN = _isFQDN

export function isBoolean(arg: any): boolean {
  return type(arg) === 'boolean'
}

export function isString(arg: any): boolean {
  return type(arg) === 'string'
}

export function isNumber(arg: any): boolean {
  return type(arg) === 'number'
}

export const isArray = Array.isArray

export function isValidArray(arg: any): boolean {
  return isArray(arg) && arg.length > 0
}

export function isNan(arg: any): boolean {
  return isNumber(arg) && Number.isNaN(arg)
}

export function isSet(arg: any): boolean {
  return type(arg) === 'set'
}

export function isWeakSet(arg: any): boolean {
  return type(arg) === 'weakset'
}

export function isMap(arg: any): boolean {
  return type(arg) === 'map'
}

export function isWeakMap(arg: any): boolean {
  return type(arg) === 'weakmap'
}

export function isSymbol(arg: any): boolean {
  return type(arg) === 'symbol'
}

export function isObject(arg: any): boolean {
  return type(arg) === 'object'
}

export function isDate(arg: any): boolean {
  return type(arg) === 'date'
}

export function isRegExp(arg: any): boolean {
  return type(arg) === 'regexp'
}

export function isError(arg: any): boolean {
  return type(arg) === 'error'
}

export function isFunction(arg: any): boolean {
  return type(arg) === 'function'
}

export function isNull(arg: any): boolean {
  return type(arg) === 'null'
}

export function isUndefined(arg: any): boolean {
  return type(arg) === 'undefined'
}

export function isNil(arg: any): boolean {
  return isNull(arg) || isUndefined(arg)
}

export function isPlainObject(arg: any): boolean {
  if (!isObject(arg)) return false

  const ctor = arg.constructor
  if (typeof ctor !== 'function') return false

  const proto = ctor.prototype
  if (!isObject(proto)) return false

  return proto.hasOwnProperty('isPrototypeOf')
}

export function isEmpty(arg: any): boolean {
  if (isNil(arg)) return true

  if (isBoolean(arg)) return false

  if (isNumber(arg)) return false

  if (isString(arg)) {
    return arg.length === 0 || whiteSpaceRegx.test(arg)
  }

  if (isFunction(arg) || isArray(arg)) {
    return arg.length === 0
  }

  switch (type(arg)) {
    case 'file':
    case 'map':
    case 'weakmap':
    case 'set':
    case 'weakset': {
      return arg.size === 0
    }

    case 'object': {
      for (const key in arg) {
        if (Object.hasOwnProperty.call(arg, key)) return false
      }
      return true
    }

    default:
      break
  }

  return false
}

export function isValid(arg: any): boolean {
  return !isEmpty(arg)
}

export function isEqual(arg1: any, arg2: any): boolean {
  return String(arg1) === String(arg2)
}

export function isTrue(arg1: any): boolean {
  return arg1 === true || arg1 === 'true' || isEqual(arg1, '1')
}

export function isFalse(arg1: any): boolean {
  return arg1 === false || arg1 === 'false' || isEqual(arg1, '0')
}

export function isBool(arg: any): boolean {
  return isTrue(arg) || isFalse(arg)
}

export function isFormData(arg: any): boolean {
  return type(arg) === 'formdata'
}

export function uniqueArray(arg: any): any[] {
  if (!isValidArray(arg)) {
    return []
  }
  return Array.from(new Set(arg))
}

export function isNumeric(arg: any, options?: IsNumericOptions): boolean {
  return isNumber(arg) || (isString(arg) && _isNumeric(arg, options))
}

export function isURL(arg: any, options?: IsURLOptions): boolean {
  return isValid(arg) && isString(arg) && _isURL(arg, options)
}

export function isEmail(arg: any, options?: IsEmailOptions): boolean {
  return isValid(arg) && isString(arg) && _isEmail(arg, options)
}

export default {
  isUUID,
  isFQDN,
  isBoolean,
  isString,
  isNumber,
  isNumeric,
  isArray,
  isValidArray,
  isNan,
  isSet,
  isMap,
  isWeakSet,
  isWeakMap,
  isSymbol,
  isObject,
  isDate,
  isRegExp,
  isError,
  isFunction,
  isNull,
  isUndefined,
  isNil,
  isPlainObject,
  isEmpty,
  isValid,
  isEqual,
  isTrue,
  isFalse,
  isBool,
  isURL,
  isEmail,
  isFormData,
  uniqueArray
}
