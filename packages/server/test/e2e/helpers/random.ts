import { randomInt } from 'node:crypto'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length = 10, alphabet = ALPHABET): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[randomInt(alphabet.length)]
  }
  return out
}

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}.${Date.now().toString(36)}.${randomString(6)}@heyform.com`
}

export function uniqueName(prefix = 'E2E'): string {
  return `${prefix} ${Date.now().toString(36)} ${randomString(4)}`
}

// Password matches server regex: lower + upper + digit + 8+ chars
export function strongPassword(): string {
  return `$E2eTest${randomString(8)}A1`
}

export function deviceId(): string {
  return `dev_${Date.now().toString(36)}_${randomString(10)}`
}
