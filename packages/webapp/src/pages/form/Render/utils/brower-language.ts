function normalizeCode(code?: string) {
  return code?.toLowerCase().replace(/_/g, '-')
}

export function getPreferredLanguage(languages: string[], fallback: string) {
  const browserLanguage = normalizeCode(window.navigator.language)

  if (!browserLanguage) {
    return fallback
  }

  const lang = languages.find(lang => {
    const code = normalizeCode(lang)!

    return (
      code === browserLanguage ||
      browserLanguage.startsWith(code) ||
      code.startsWith(browserLanguage)
    )
  })

  return lang || fallback
}

export function getFormLanguage(languages: string[], formLocale?: string) {
  const locale = normalizeCode(formLocale)
  return locale && languages.includes(locale) ? locale : getPreferredLanguage(languages, 'en')
}
