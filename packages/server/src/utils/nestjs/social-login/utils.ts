import { qs } from '@heyform-inc/utils'
import axios from 'axios'

export const request = axios.create({
  withCredentials: true,
  timeout: 6e4
}).request

export function generateUrl(
  prefixUri: string,
  query: Record<string, any>
): string {
  const queryString = qs.stringify(query)
  return `${prefixUri}?${queryString}`
}
