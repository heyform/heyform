const numeric = '0123456789'
const hexic = '0123456789abcdef'
const lower = 'abcdefghijklmnopqrstuvwxyz'
const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const length = 6

export enum RandomType {
  LOWER,
  UPPER,
  NUMERIC,
  HEXIC,
  LOWER_NUMERIC,
  UPPER_NUMERIC,
  ALPHANUMERIC
}

export function random(
  len = length * 2,
  type = RandomType.ALPHANUMERIC
): string {
  let alphabet: string = numeric + lower + upper

  switch (type) {
    case RandomType.LOWER:
      alphabet = lower
      break
    case RandomType.UPPER:
      alphabet = upper
      break
    case RandomType.HEXIC:
      alphabet = hexic
      break
    case RandomType.NUMERIC:
      alphabet = numeric
      break
    case RandomType.LOWER_NUMERIC:
      alphabet = lower + numeric
      break
    case RandomType.UPPER_NUMERIC:
      alphabet = upper + numeric
      break
    case RandomType.ALPHANUMERIC:
      alphabet = lower + upper + numeric
      break
  }

  let str = ''
  const alphabetLength = alphabet.length

  for (let i = 0; i < len; i++) {
    str += alphabet.charAt(Math.floor(Math.random() * alphabetLength))
  }

  return str
}
