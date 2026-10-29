import * as assert from 'assert'
import got from 'got'

import { ChangelogService } from '../src/service/changelog.service'

async function run() {
  const originalGet = got.get
  const originalNow = Date.now
  let now = 1
  let requests = 0
  let failure: Error | undefined
  let release = { id: 1, published_at: '2026-10-29T00:00:00Z' }
  Date.now = () => now
  got.get = (() => ({
    json: async () => {
      requests++
      if (failure) throw failure
      return release
    }
  })) as unknown as typeof got.get

  try {
    const service = new ChangelogService()
    const expected = { id: 1, publishedAt: release.published_at }
    assert.deepStrictEqual(
      await Promise.all([service.getLatestRelease(), service.getLatestRelease()]),
      [expected, expected]
    )
    assert.strictEqual(requests, 1)
    assert.deepStrictEqual(await service.getLatestRelease(), expected)
    assert.strictEqual(requests, 1)

    // Rate limits retain the last successful release and don't retry on every visit.
    now += 5 * 60 * 1000
    failure = Object.assign(new Error('API rate limit exceeded'), {
      response: { statusCode: 403 }
    })
    assert.deepStrictEqual(await service.getLatestRelease(), expected)
    assert.deepStrictEqual(await service.getLatestRelease(), expected)
    assert.strictEqual(requests, 2)

    // With no cached release, an upstream failure simply means no update badge.
    const coldService = new ChangelogService()
    assert.strictEqual(await coldService.getLatestRelease(), null)
    assert.strictEqual(await coldService.getLatestRelease(), null)
    assert.strictEqual(requests, 3)

    // Retry after the cache expires and recover when GitHub becomes available.
    now += 5 * 60 * 1000
    failure = undefined
    release = { ...release, id: 2 }
    assert.deepStrictEqual(await coldService.getLatestRelease(), {
      id: 2,
      publishedAt: release.published_at
    })
    assert.strictEqual(requests, 4)
  } finally {
    got.get = originalGet
    Date.now = originalNow
  }
}

if (require.main === module) {
  run().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
