import { helper } from '@heyform-inc/utils'

export function requestParser(req: any, keys: string[]): any {
  const sources = ['body', 'query', 'params']
  let value: any

  for (const source of sources) {
    for (const key of keys) {
      const searchValue = req[source][key]

      if (helper.isValid(searchValue)) {
        value = searchValue
        break
      }
    }
  }

  return value
}
