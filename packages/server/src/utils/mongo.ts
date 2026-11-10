import { helper } from '@heyform-inc/utils'

export function getUpdateQuery(
  obj: Record<string, any>,
  prefix: string,
  deep = true
): Record<string, any> {
  let query: Record<string, any> = {}

  Object.keys(obj).forEach(key => {
    const value = obj[key]

    if (deep && helper.isPlainObject(value)) {
      query = {
        ...query,
        ...getUpdateQuery(value, `${prefix}.${key}`)
      }
    } else if (!helper.isNil(value)) {
      query[`${prefix}.${key}`] = value
    }
  })

  return query
}

// Whether a write failed because another account already has the email address
export function isDuplicateEmailError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const { code, keyPattern } = error as { code?: number; keyPattern?: Record<string, unknown> }

  return code === 11000 && keyPattern?.email !== undefined
}
