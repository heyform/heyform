import * as assert from 'assert'

import { assertSafeOutboundUrl, isPrivateAddress } from '../src/utils/outbound-url'

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

async function run() {
  testBlocksAlternateIPv6Encodings()
  testAllowsPublicMappedAddresses()
  testPreservesKnownRanges()
  await testAssertSafeOutboundUrlRejectsEncodedPrivate()
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
