import axios from 'axios'

import { qs } from '@heyform-inc/utils'

export const request = axios.create({
  withCredentials: true,
  timeout: 6e4
}).request

export function generateUrl(prefixUri: string, query: Record<string, any>): string {
  const queryString = qs.stringify(query)
  return `${prefixUri}?${queryString}`
}

export const defaultLocales = ['en', 'zh-cn']

export function formatLocale(lang?: string, whiteList?: string[]): string {
  const customWhiteList = whiteList || defaultLocales
  const defaultLocale = customWhiteList[0]

  if (!lang) {
    return defaultLocale
  }

  const lower = lang.toLowerCase()
  return customWhiteList.includes(lower) ? lower : defaultLocale
}
