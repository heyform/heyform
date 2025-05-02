function getBrowserLanguage() {
  if (typeof window === 'undefined') {
    return
  }

  return (window.navigator.languages && window.navigator.languages[0]) || window.navigator.language
}

function normalizeCode(code?: string) {
  return code?.toLowerCase().replace(/_/g, '-')
}

interface GetPreferredLanguageOptions {
  languages: string[]
  fallback: string
}

export function getPreferredLanguage({ languages, fallback }: GetPreferredLanguageOptions) {
  const browserLanguage = normalizeCode(getBrowserLanguage())

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
