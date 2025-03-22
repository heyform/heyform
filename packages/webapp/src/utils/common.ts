import { helper, toURLQuery } from '@heyform-inc/utils'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSubdomain(domain: string) {
  if (!isValidDomain(domain)) {
    return
  }

  const arr = domain.split('.')

  if (arr.length === 2) {
    return 'www'
  }

  return arr[0]
}

export function getDomainName(domain: string) {
  if (!isValidDomain(domain)) {
    return
  }

  const arr = domain.split('.')

  if (arr.length === 2) {
    return '@'
  }

  return arr[0]
}

export function isRootDomain(domain: string) {
  return isValidDomain(domain) && domain.split('.').length === 2
}

export function isValidDomain(domain: string) {
  if (
    !helper.isValid(domain) ||
    !helper.isFQDN(domain, {
      allow_underscores: true,
      allow_numeric_tld: true,
      allow_wildcard: true
    })
  ) {
    return false
  }

  return domain.split('.').length <= 3
}

export function scrollIntoViewIfNeeded(container: HTMLElement, target: HTMLElement) {
  if (!container || !target) return

  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  const isInViewport =
    targetRect.top >= containerRect.top && targetRect.bottom <= containerRect.bottom

  if (!isInViewport) {
    const scrollTop = targetRect.top - containerRect.top + container.scrollTop

    container.scrollTo({
      top: scrollTop,
      behavior: 'auto'
    })
  }
}

export function uniqueArray<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

export function getDecoratedURL(url: string, query: Record<string, string>) {
  return toURLQuery(query, url)
}

export function nextTick(callback: () => void, ms = 1_000) {
  setTimeout(callback, ms / 60)
}
