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
