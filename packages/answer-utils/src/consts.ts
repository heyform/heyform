export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20ac',
  GBP: '\xa3',
  USD: '$',
  AUD: 'A$',
  CAD: 'CA$',
  CHF: 'CHF ',
  NOK: 'NOK ',
  SEK: 'SEK ',
  DKK: 'DKK ',
  MXN: 'MX$',
  NZD: 'NZ$',
  BRL: 'R$'
}

// Stands in for "Other" wherever a logic rule names a choice. Choice IDs come from an
// alphanumeric nanoid alphabet, so an ID with underscores can't collide with a real option.
export const OTHER_CHOICE_ID = '__other__'

// Shown for an "Other" answer the respondent left blank.
export const OTHER_CHOICE_LABEL = 'Other'
