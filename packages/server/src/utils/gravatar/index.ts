import { md5 } from '../crypto'

export function gravatar(email: string, size = 120): string {
  return `https://secure.gravatar.com/avatar/${md5(email)}?s=${size}&d=mm&r=g`
}
