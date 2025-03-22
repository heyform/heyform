import { qs, removeObjectNil } from '@heyform-inc/utils'

export function buildUrlQuery(uri: string, query: Record<string, any>): string {
  const str = qs.stringify(removeObjectNil(query))
  return uri + (uri.includes('?') ? '&' + str : '?' + str)
}
