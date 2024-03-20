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
