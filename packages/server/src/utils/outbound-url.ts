import { BadRequestException } from '@nestjs/common'
import { promises as dns } from 'dns'
import type { LookupAddress } from 'dns'
import { BlockList } from 'node:net'
import isIP from 'validator/lib/isIP'
import isURL from 'validator/lib/isURL'

interface SafeOutboundUrlOptions {
  allowedHosts?: string[]
  allowedPrivateOrigins?: string[]
  dnsLookup?: typeof dns.lookup
  skipDnsLookup?: boolean
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: any, family?: number) => void
type IPFamily = 4 | 6

interface EntryObject {
  readonly address: string
  readonly family: IPFamily
}

interface LookupOptions {
  all?: boolean
  family?: IPFamily
  hints?: number
}

interface SafeLookupFunction {
  (
    hostname: string,
    family: IPFamily,
    callback: (error: NodeJS.ErrnoException, address: string, family: IPFamily) => void
  ): void
  (
    hostname: string,
    callback: (error: NodeJS.ErrnoException, address: string, family: IPFamily) => void
  ): void
  (
    hostname: string,
    options: LookupOptions & { all: true },
    callback: (error: NodeJS.ErrnoException, result: ReadonlyArray<EntryObject>) => void
  ): void
  (
    hostname: string,
    options: LookupOptions,
    callback: (error: NodeJS.ErrnoException, address: string, family: IPFamily) => void
  ): void
}

interface SafeOutboundUrlValidation {
  addresses?: EntryObject[]
  url: URL
}

export interface SafeOutboundRequest {
  lookup?: SafeLookupFunction
  url: URL
}

function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[/, '').replace(/\]$/, '')
}

function normalizeHostname(hostname: string): string {
  return stripIpv6Brackets(hostname).replace(/\.$/, '').toLowerCase()
}

export function normalizeUrlOrigin(url: URL): string {
  const hostname = normalizeHostname(url.hostname)
  const host = isIPv6(hostname) ? `[${hostname}]` : hostname

  return `${url.protocol.toLowerCase()}//${host}${url.port ? `:${url.port}` : ''}`
}

function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' && process.env.HEYFORM_ALLOW_PRIVATE_OUTBOUND === 'true'
  )
}

export function isIPv4(address: string): boolean {
  return isIP(normalizeHostname(address), 4)
}

export function isIPv6(address: string): boolean {
  return isIP(normalizeHostname(address), 6)
}

export function isHttpUrl(rawUrl: string): boolean {
  return isURL(rawUrl, {
    protocols: ['http'],
    require_protocol: true,
    require_valid_protocol: true,
    require_tld: false,
    allow_protocol_relative_urls: false
  })
}

export function isHttpsUrl(rawUrl: string): boolean {
  return isURL(rawUrl, {
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
    require_tld: false,
    allow_protocol_relative_urls: false
  })
}

function isHttpOrHttpsUrl(rawUrl: string): boolean {
  return isHttpUrl(rawUrl) || isHttpsUrl(rawUrl)
}

// Private, reserved, and non-routable ranges. Evaluated numerically via
// node:net BlockList so that alternate textual encodings of the same address
// (e.g. the hex IPv4-mapped form `::ffff:808:808` that `new URL()` produces
// from `[::ffff:8.8.8.8]`, or IPv4-compatible / NAT64 / 6to4 forms) are
// classified by value rather than by string prefix.
const PRIVATE_IPV4 = new BlockList()
PRIVATE_IPV4.addSubnet('0.0.0.0', 8) // "this" network
PRIVATE_IPV4.addSubnet('10.0.0.0', 8) // RFC1918
PRIVATE_IPV4.addSubnet('127.0.0.0', 8) // loopback
PRIVATE_IPV4.addSubnet('100.64.0.0', 10) // RFC6598 shared address space / CGNAT
PRIVATE_IPV4.addSubnet('169.254.0.0', 16) // link-local
PRIVATE_IPV4.addSubnet('172.16.0.0', 12) // RFC1918
PRIVATE_IPV4.addSubnet('192.168.0.0', 16) // RFC1918
PRIVATE_IPV4.addSubnet('198.18.0.0', 15) // RFC2544 benchmarking
PRIVATE_IPV4.addSubnet('224.0.0.0', 3) // multicast, reserved, broadcast (>= 224)

const PRIVATE_IPV6 = new BlockList()
PRIVATE_IPV6.addAddress('::', 'ipv6') // unspecified
PRIVATE_IPV6.addAddress('::1', 'ipv6') // loopback
PRIVATE_IPV6.addSubnet('100::', 64, 'ipv6') // discard-only (RFC6666)
PRIVATE_IPV6.addSubnet('2001::', 32, 'ipv6') // Teredo (RFC4380)
PRIVATE_IPV6.addSubnet('2001:db8::', 32, 'ipv6') // documentation (RFC3849)
PRIVATE_IPV6.addSubnet('3fff::', 20, 'ipv6') // documentation (RFC9637)
PRIVATE_IPV6.addSubnet('fc00::', 7, 'ipv6') // unique-local
PRIVATE_IPV6.addSubnet('fe80::', 10, 'ipv6') // link-local
PRIVATE_IPV6.addSubnet('fec0::', 10, 'ipv6') // site-local (deprecated)
PRIVATE_IPV6.addSubnet('ff00::', 8, 'ipv6') // multicast

// Expand a valid IPv6 address to its eight 16-bit hextets, resolving `::`
// compression and any trailing dotted-quad IPv4 tail.
function ipv6ToHextets(address: string): number[] | null {
  let s = address
  const zone = s.indexOf('%')
  if (zone >= 0) {
    s = s.slice(0, zone)
  }

  let v4Tail: number[] = []
  const dotted = s.match(/:((?:\d{1,3}\.){3}\d{1,3})$/)
  if (dotted) {
    const octets = dotted[1].split('.').map(Number)
    if (octets.some(o => o > 255)) {
      return null
    }
    v4Tail = [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]]
    s = s.slice(0, s.length - dotted[1].length)
  }

  const dbl = s.indexOf('::')
  const head = (dbl >= 0 ? s.slice(0, dbl) : s.replace(/:$/, ''))
    .split(':')
    .filter(Boolean)
    .map(h => parseInt(h, 16))
  const tail = (dbl >= 0 ? s.slice(dbl + 2) : '')
    .split(':')
    .filter(Boolean)
    .map(h => parseInt(h, 16))
    .concat(v4Tail)

  const groups = [...head, ...tail]
  if (groups.some(g => Number.isNaN(g) || g < 0 || g > 0xffff)) {
    return null
  }

  const fill = 8 - groups.length
  if (dbl >= 0) {
    if (fill < 0) {
      return null
    }

    return [...head, ...new Array(fill).fill(0), ...tail]
  }

  return groups.length === 8 ? groups : null
}

// If the IPv6 address embeds an IPv4 address (IPv4-mapped `::ffff:0:0/96`,
// deprecated IPv4-compatible `::/96`, NAT64 `64:ff9b::/96`, or 6to4
// `2002::/16`), return that IPv4 address in dotted form so it can be screened
// against the IPv4 ranges. Returns null otherwise.
function embeddedIPv4(address: string): string | null {
  const h = ipv6ToHextets(address)
  if (!h) {
    return null
  }

  const dotted = (hi: number, lo: number): string =>
    `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`

  const topFiveZero = h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0

  if (topFiveZero && h[5] === 0xffff) {
    return dotted(h[6], h[7]) // IPv4-mapped ::ffff:0:0/96
  }
  if (topFiveZero && h[5] === 0 && (h[6] !== 0 || h[7] > 1)) {
    return dotted(h[6], h[7]) // IPv4-compatible ::/96 (:: and ::1 handled as pure IPv6)
  }
  if (h[0] === 0x64 && h[1] === 0xff9b && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0) {
    return dotted(h[6], h[7]) // NAT64 well-known prefix 64:ff9b::/96
  }
  if (h[0] === 0x2002) {
    return dotted(h[1], h[2]) // 6to4 2002::/16
  }

  return null
}

function isPrivateIPv4(address: string): boolean {
  return isIPv4(address) && PRIVATE_IPV4.check(address)
}

function isPrivateIPv6(address: string): boolean {
  if (!isIPv6(address)) {
    return false
  }

  if (PRIVATE_IPV6.check(address, 'ipv6')) {
    return true
  }

  const embedded = embeddedIPv4(address)

  return embedded !== null && isPrivateIPv4(embedded)
}

export function isLoopbackAddress(address: string): boolean {
  const normalized = normalizeHostname(address)

  if (isIPv4(normalized)) {
    return normalized.startsWith('127.')
  }

  if (isIPv6(normalized)) {
    return normalized === '::1' || normalized === '0:0:0:0:0:0:0:1'
  }

  return false
}

export function isPrivateAddress(address: string): boolean {
  const normalized = normalizeHostname(address)

  if (isIPv4(normalized)) {
    return isPrivateIPv4(normalized)
  }

  if (isIPv6(normalized)) {
    return isPrivateIPv6(normalized)
  }

  return false
}

export function isLocalHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname)
  return normalized === 'localhost' || normalized.endsWith('.localhost')
}

export function isLocalDevelopmentHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname)

  return isDevelopment() && (isLocalHostname(normalized) || isLoopbackAddress(normalized))
}

export function isAllowedHostname(hostname: string, allowedHosts: string[]): boolean {
  const normalized = normalizeHostname(hostname)

  return allowedHosts
    .map(allowedHost => normalizeHostname(allowedHost))
    .some(allowedHost => normalized === allowedHost || normalized.endsWith(`.${allowedHost}`))
}

export function isAllowedUrlOrigin(rawUrl: string | URL, allowedOrigins: string[]): boolean {
  let url: URL

  try {
    url = rawUrl instanceof URL ? rawUrl : new URL(rawUrl)
  } catch {
    return false
  }

  const normalized = normalizeUrlOrigin(url)

  return allowedOrigins
    .map(allowedOrigin => {
      try {
        return normalizeUrlOrigin(new URL(allowedOrigin))
      } catch {
        return
      }
    })
    .some(allowedOrigin => normalized === allowedOrigin)
}

function createLookupError(hostname: string): NodeJS.ErrnoException {
  const error = new Error(`No validated address for ${hostname}`) as NodeJS.ErrnoException
  error.code = 'ENOTFOUND'
  return error
}

function isIPFamily(value: unknown): value is IPFamily {
  return value === 4 || value === 6
}

function toPinnedLookupEntries(addresses: LookupAddress[]): EntryObject[] {
  return addresses
    .filter(row => isIPFamily(row.family))
    .map(row => ({
      address: row.address,
      family: row.family as IPFamily
    }))
}

function createPinnedLookup(hostname: string, addresses: EntryObject[]): SafeLookupFunction {
  const normalizedHostname = normalizeHostname(hostname)

  const lookup = (requestedHostname: string, options: any, callback?: LookupCallback) => {
    if (typeof options === 'function') {
      callback = options
      options = {}
    } else if (typeof options === 'number') {
      options = {
        family: options
      }
    }

    const cb = callback!

    if (normalizeHostname(requestedHostname) !== normalizedHostname) {
      cb(createLookupError(requestedHostname))
      return
    }

    const family = isIPFamily(options?.family) ? options.family : undefined
    const candidates = family ? addresses.filter(row => row.family === family) : addresses

    if (candidates.length < 1) {
      cb(createLookupError(requestedHostname))
      return
    }

    if (options?.all) {
      cb(null, candidates)
      return
    }

    const [first] = candidates
    cb(null, first.address, first.family)
  }

  return lookup as SafeLookupFunction
}

async function validateSafeOutboundUrl(
  rawUrl: string,
  options: SafeOutboundUrlOptions = {}
): Promise<SafeOutboundUrlValidation> {
  let url: URL

  if (!isHttpOrHttpsUrl(rawUrl)) {
    throw new BadRequestException('URL protocol is not allowed')
  }

  try {
    url = new URL(rawUrl)
  } catch {
    throw new BadRequestException('Invalid URL')
  }

  const hostname = normalizeHostname(url.hostname)
  const isDevelopmentHost = isLocalDevelopmentHost(hostname)
  const isAllowedPrivateOrigin = isAllowedUrlOrigin(url, options.allowedPrivateOrigins || [])

  if (isLocalHostname(hostname) && !isDevelopmentHost && !isAllowedPrivateOrigin) {
    throw new BadRequestException('Localhost URLs are not allowed')
  }

  if (
    options.allowedHosts &&
    !isDevelopmentHost &&
    !isAllowedHostname(hostname, options.allowedHosts)
  ) {
    throw new BadRequestException('URL host is not allowed')
  }

  if (isIPv4(hostname) || isIPv6(hostname)) {
    if (!isDevelopmentHost && !isAllowedPrivateOrigin && isPrivateAddress(hostname)) {
      throw new BadRequestException('Private network URLs are not allowed')
    }

    return { url }
  }

  if (!options.skipDnsLookup) {
    const dnsLookup = options.dnsLookup || dns.lookup
    const addresses = (await dnsLookup(hostname, {
      all: true,
      verbatim: true
    } as any)) as unknown as LookupAddress[]

    if (
      addresses.some(
        row =>
          isPrivateAddress(row.address) &&
          !(isDevelopmentHost && isLoopbackAddress(row.address)) &&
          !isAllowedPrivateOrigin
      )
    ) {
      throw new BadRequestException('Private network URLs are not allowed')
    }

    const pinnedAddresses = toPinnedLookupEntries(addresses)

    if (pinnedAddresses.length < 1) {
      throw new BadRequestException('Unable to resolve URL host')
    }

    return { addresses: pinnedAddresses, url }
  }

  return { url }
}

export async function assertSafeOutboundUrl(
  rawUrl: string,
  options: SafeOutboundUrlOptions = {}
): Promise<URL> {
  return (await validateSafeOutboundUrl(rawUrl, options)).url
}

export async function assertSafeOutboundRequest(
  rawUrl: string,
  options: SafeOutboundUrlOptions = {}
): Promise<SafeOutboundRequest> {
  const result = await validateSafeOutboundUrl(rawUrl, options)

  return {
    url: result.url,
    lookup: result.addresses ? createPinnedLookup(result.url.hostname, result.addresses) : undefined
  }
}
