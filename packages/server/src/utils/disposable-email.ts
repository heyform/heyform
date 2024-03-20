import * as blocklist from 'disposable-email-blocklist'

export function isDisposableEmail(email: string): boolean {
  const [_, domain] = email.toLowerCase().split('@')
  return ((blocklist as unknown) as string[]).includes(domain)
}
