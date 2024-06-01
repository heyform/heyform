import { clone } from './clone'
import {
  isArray,
  isNan,
  isNil,
  isObject,
  isPlainObject,
  isValid
} from './helper'
import * as objectPath from 'object-path'

export { deepEqual } from 'fast-equals'

export function pickObject(
  target: Record<string, any>,
  fields: Array<string | string[]>,
  excludes: Array<string> = []
): Record<string, any> {
  if (!isObject(target)) {
    return {}
  }

  const copied = clone<Record<string, any>>(target)
  const targetKeys = Object.keys(copied)

  const fieldAlias: Record<string, any> = {}
  let picked: string[] = []

  if (fields.length > 0) {
    fields.forEach(item => {
      if (isArray(item)) {
        if (item.length > 0) {
          const filed = item[0]
          picked.push(filed)

          if (item.length > 1) {
            fieldAlias[filed] = item[1]
          }
        }
      } else {
        picked.push(item)
      }
    })
  } else {
    picked = targetKeys
  }

  const newObj: Record<string, any> = {}

  targetKeys
    .filter(key => !excludes.includes(key) && picked.includes(key))
    .forEach(key => {
      const alias = fieldAlias[key]

      if (alias) {
        newObj[alias] = copied[key]
      } else {
        newObj[key] = copied[key]
      }
    })

  return newObj
}

export function pickValidValues<T = string | number | boolean>(
  target: Record<string, T>,
  fields: Array<string | string[]>
): Record<string, T> {
  const dist: Record<string, T> = {}

  fields.forEach(field => {
    let key = String(field)
    let alias: string | undefined

    if (isArray(field)) {
      key = field[0]

      if (field.length > 1) {
        alias = field[1]
      }
    }

    let value = target[key]

    if (isValid(value)) {
      if (isPlainObject(value) || isArray(value)) {
        value = clone(value)
      }

      dist[alias || key] = value
    }
  })

  return dist
}

export function removeObjectNil(
  target: Record<string, any>
): Record<string, any> {
  if (!isObject(target)) {
    return {}
  }

  const copied = clone<Record<string, any>>(target)
  const newObj: Record<string, any> = {}

  for (const field of Object.keys(copied)) {
    const value = copied[field]

    if (isNil(value) || isNan(value)) {
      continue
    }

    newObj[field] = value
  }

  return newObj
}

export function copyObjectValues(
  target: Record<string, any>,
  dist: Record<string, any>,
  keyMaps: Array<string | string[]>
): void {
  if (!isObject(target) || !isObject(dist)) {
    return
  }

  for (const keys of keyMaps) {
    let targetKey: string
    let distKey: string

    if (isArray(keys)) {
      targetKey = keys[0]
      distKey = keys[1]
    } else {
      targetKey = String(keys)
      distKey = targetKey
    }

    let value = objectPath.get(target, targetKey)

    if (!isNil(value) && !isNan(value)) {
      if (isPlainObject(value) || isArray(value)) {
        value = clone(value)
      }
      objectPath.set(dist, distKey, value)
    }
  }
}
