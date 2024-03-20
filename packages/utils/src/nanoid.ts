import { customAlphabet } from 'nanoid'

const NANOID_ALPHABET =
  'ModuleSymbhasOwnPr0123456789ABCDEFGHNRVfgctiUvzKqYTJkLxpZXIjQW'

export function nanoid(len = 21): string {
  return nanoidCustomAlphabet(NANOID_ALPHABET, len)
}

export function nanoidCustomAlphabet(alphabet: string, len = 21): string {
  const generate = customAlphabet(alphabet, len)
  return generate()
}
