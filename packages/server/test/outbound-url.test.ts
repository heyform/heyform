import * as assert from 'assert'

import {
  assertSafeOutboundRequest,
  assertSafeOutboundUrl,
  isPrivateAddress
} from '../src/utils/outbound-url'

async function withNodeEnv<T>(value: string, fn: () => Promise<T>): Promise<T> {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = value

  try {
    return await fn()
  } finally {
    if (previous === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previous
    }
  }
}

async function withOutboundEnvironment<T>(
  nodeEnv: string | undefined,
  allowPrivateOutbound: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const previousNodeEnv = process.env.NODE_ENV
  const previousAllowPrivateOutbound = process.env.HEYFORM_ALLOW_PRIVATE_OUTBOUND

  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV
  } else {
    process.env.NODE_ENV = nodeEnv
  }

  if (allowPrivateOutbound === undefined) {
    delete process.env.HEYFORM_ALLOW_PRIVATE_OUTBOUND
  } else {
    process.env.HEYFORM_ALLOW_PRIVATE_OUTBOUND = allowPrivateOutbound
  }

  try {
    return await fn()
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
    }

    if (previousAllowPrivateOutbound === undefined) {
      delete process.env.HEYFORM_ALLOW_PRIVATE_OUTBOUND
    } else {
      process.env.HEYFORM_ALLOW_PRIVATE_OUTBOUND = previousAllowPrivateOutbound
    }
  }
}

// Alternate IPv6 encodings of private/reserved IPv4 addresses must be blocked.
// These reach isPrivateAddress() when a hostname resolves (via DNS) to such an
// AAAA record, and were previously classified as public.
function testBlocksAlternateIPv6Encodings() {
  // Deprecated IPv4-compatible ::/96 (RFC 4291 2.5.5.1)
  assert.strictEqual(isPrivateAddress('::a9fe:a9fe'), true) // -> 169.254.169.254
  assert.strictEqual(isPrivateAddress('::169.254.169.254'), true)
  assert.strictEqual(isPrivateAddress('::7f00:1'), true) // -> 127.0.0.1
  // NAT64 well-known prefix 64:ff9b::/96
  assert.strictEqual(isPrivateAddress('64:ff9b::a9fe:a9fe'), true) // -> 169.254.169.254
  // 6to4 2002::/16
  assert.strictEqual(isPrivateAddress('2002:7f00:1::'), true) // -> 127.0.0.1
  // Teredo 2001::/32 (server=192.168.0.1, obfuscated client=127.0.0.1)
  assert.strictEqual(isPrivateAddress('2001:0:c0a8:1:0:0:80ff:fffe'), true)
  // Discard-only and documentation prefixes
  assert.strictEqual(isPrivateAddress('100::1'), true)
  assert.strictEqual(isPrivateAddress('2001:db8::1'), true)
  assert.strictEqual(isPrivateAddress('3fff::1'), true)
  // Site-local (deprecated)
  assert.strictEqual(isPrivateAddress('fec0::1'), true)
}

// Public IPv4-mapped addresses must stay allowed. `new URL()` normalizes
// `[::ffff:8.8.8.8]` to the hex form `::ffff:808:808`; the previous string
// match wrongly rejected that form as private.
function testAllowsPublicMappedAddresses() {
  assert.strictEqual(isPrivateAddress('::ffff:8.8.8.8'), false)
  assert.strictEqual(isPrivateAddress('::ffff:808:808'), false)
  assert.strictEqual(isPrivateAddress('64:ff9b::8.8.8.8'), false)
  assert.strictEqual(isPrivateAddress('2002:808:808::'), false)
}

function testPreservesKnownRanges() {
  for (const addr of [
    '10.0.0.1',
    '127.0.0.1',
    '169.254.1.1',
    '172.16.0.1',
    '192.168.1.1',
    '100.64.0.1',
    '198.18.0.1',
    '0.1.2.3',
    '255.255.255.255',
    '224.0.0.1',
    '::1',
    'fc00::1',
    'fd00::1',
    'fe80::1'
  ]) {
    assert.strictEqual(isPrivateAddress(addr), true, `expected ${addr} to be private`)
  }

  for (const addr of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) {
    assert.strictEqual(isPrivateAddress(addr), false, `expected ${addr} to be public`)
  }
}

async function testAssertSafeOutboundUrlRejectsEncodedPrivate() {
  await assert.rejects(() =>
    assertSafeOutboundUrl('http://[::a9fe:a9fe]/webhook', { skipDnsLookup: true })
  )
  await assert.rejects(() =>
    assertSafeOutboundUrl('http://[64:ff9b::a9fe:a9fe]/webhook', { skipDnsLookup: true })
  )

  const url = await assertSafeOutboundUrl('http://[::ffff:8.8.8.8]/webhook', {
    skipDnsLookup: true
  })
  assert.ok(url instanceof URL)
}

async function testRejectsTeredoDnsResolution() {
  await assert.rejects(
    () =>
      assertSafeOutboundUrl('https://evil.example/hook', {
        dnsLookup: (async () => [
          {
            address: '2001:0:c0a8:1:0:0:80ff:fffe',
            family: 6
          }
        ]) as any
      }),
    (error: any) => error?.message === 'Private network URLs are not allowed'
  )
}

async function testLocalOutboundAccessFailsClosed() {
  for (const nodeEnv of [undefined, 'production', 'test', 'development']) {
    await withOutboundEnvironment(nodeEnv, undefined, async () => {
      await assert.rejects(() =>
        assertSafeOutboundUrl('http://127.0.0.1:6379/private', { skipDnsLookup: true })
      )
      await assert.rejects(() =>
        assertSafeOutboundUrl('http://localhost:6379/private', { skipDnsLookup: true })
      )
    })
  }
}

async function testExplicitDevelopmentOutboundOptIn() {
  await withOutboundEnvironment('development', 'true', async () => {
    const loopback = await assertSafeOutboundUrl('http://127.0.0.1:6379/private', {
      skipDnsLookup: true
    })
    const localhost = await assertSafeOutboundUrl('http://localhost:6379/private', {
      skipDnsLookup: true
    })

    assert.strictEqual(loopback.hostname, '127.0.0.1')
    assert.strictEqual(localhost.hostname, 'localhost')
  })
}

async function lookupAll(lookup: any, hostname: string, family?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    lookup(hostname, { all: true, family }, (error: Error | null, addresses: any[]) => {
      if (error) {
        reject(error)
      } else {
        resolve(addresses)
      }
    })
  })
}

async function lookupOne(lookup: any, hostname: string, family?: number): Promise<any> {
  return new Promise((resolve, reject) => {
    lookup(hostname, { family }, (error: Error | null, address: string, resolvedFamily: number) => {
      if (error) {
        reject(error)
      } else {
        resolve({ address, family: resolvedFamily })
      }
    })
  })
}

async function testSafeOutboundRequestPinsValidatedDnsAddresses() {
  await withNodeEnv('production', async () => {
    const result = await assertSafeOutboundRequest('http://rebind.example.test/avatar.png', {
      dnsLookup: (async () => [
        {
          address: '93.184.216.34',
          family: 4
        }
      ]) as any
    })

    assert.strictEqual(result.url.hostname, 'rebind.example.test')
    assert.ok(result.lookup)
    assert.deepStrictEqual(await lookupAll(result.lookup, 'rebind.example.test'), [
      {
        address: '93.184.216.34',
        family: 4
      }
    ])
    assert.deepStrictEqual(await lookupOne(result.lookup, 'rebind.example.test'), {
      address: '93.184.216.34',
      family: 4
    })
    await assert.rejects(() => lookupAll(result.lookup, 'other.example.test'))
  })
}

async function run() {
  testBlocksAlternateIPv6Encodings()
  testAllowsPublicMappedAddresses()
  testPreservesKnownRanges()
  await testAssertSafeOutboundUrlRejectsEncodedPrivate()
  await testRejectsTeredoDnsResolution()
  await testLocalOutboundAccessFailsClosed()
  await testExplicitDevelopmentOutboundOptIn()
  await testSafeOutboundRequestPinsValidatedDnsAddresses()
}

if (require.main === module) {
  run()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('outbound-url tests passed')
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error)
      process.exitCode = 1
    })
}

export { run }
