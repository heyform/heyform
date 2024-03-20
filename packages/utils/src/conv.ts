import { isEmpty, isTrue, isBoolean } from './helper'

export function toBool(value: unknown, defaults?: boolean): boolean {
  if (isEmpty(value)) {
    return defaults || false
  }

  if (isBoolean(value)) {
    return value as boolean
  }

  return isTrue(value)
}
