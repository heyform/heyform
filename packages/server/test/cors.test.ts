import assert from 'assert'

import {
  createCorsOriginChecker,
  isCorsOriginAllowed,
  normalizeCorsAllowedOrigins,
  normalizeCorsOrigin
} from '../src/config/cors'

// The middleware app.enableCors() runs. It comes with the Express platform, not as a dependency
// of the server itself.
const cors = require(
  require.resolve('cors', { paths: [require.resolve('@nestjs/platform-express')] })
)

function runCorsMiddleware(origin: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {}
  const middleware = cors({
    origin: createCorsOriginChecker(['https://app.example.com']),
    credentials: true
  })

  return new Promise((resolve, reject) => {
    const req = {
      headers: {
        origin
      },
      method: 'POST'
    }
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value
      },
      getHeader: (key: string) => headers[key],
      removeHeader: (key: string) => {
        delete headers[key]
      }
    }

    middleware(req, res, (err: Error | null) => {
      if (err) {
        reject(err)
      } else {
        resolve(headers)
      }
    })
  })
}

function testNormalizesOrigins() {
  assert.strictEqual(
    normalizeCorsOrigin('https://app.example.com/path?q=1'),
    'https://app.example.com'
  )
  assert.strictEqual(normalizeCorsOrigin(' https://app.example.com/ '), 'https://app.example.com')
  assert.strictEqual(normalizeCorsOrigin('not-a-url'), undefined)
}

function testBuildsUniqueAllowlist() {
  assert.deepStrictEqual(
    normalizeCorsAllowedOrigins([
      'https://app.example.com',
      'https://app.example.com/',
      'http://localhost:3000',
      ''
    ]),
    ['https://app.example.com', 'http://localhost:3000']
  )
}

function testAllowsOnlyConfiguredOrigins() {
  const allowedOrigins = ['https://app.example.com', 'http://localhost:3000']

  assert.strictEqual(isCorsOriginAllowed('https://app.example.com', allowedOrigins), true)
  assert.strictEqual(isCorsOriginAllowed('https://app.example.com/path', allowedOrigins), true)
  assert.strictEqual(isCorsOriginAllowed('https://evil.example.com', allowedOrigins), false)
  assert.strictEqual(isCorsOriginAllowed(undefined, allowedOrigins), false)
}

async function testOriginCheckerCallback() {
  const checker = createCorsOriginChecker(['https://app.example.com'])

  const allowed = await new Promise<boolean | undefined>((resolve, reject) => {
    checker('https://app.example.com', (err, allow) => {
      if (err) {
        reject(err)
      } else {
        resolve(allow)
      }
    })
  })

  const denied = await new Promise<boolean | undefined>((resolve, reject) => {
    checker('https://evil.example.com', (err, allow) => {
      if (err) {
        reject(err)
      } else {
        resolve(allow)
      }
    })
  })

  assert.strictEqual(allowed, true)
  assert.strictEqual(denied, false)
}

async function testCorsMiddlewareDoesNotReflectDeniedOrigins() {
  const allowedHeaders = await runCorsMiddleware('https://app.example.com')
  const deniedHeaders = await runCorsMiddleware('https://evil.example.com')

  assert.strictEqual(allowedHeaders['Access-Control-Allow-Origin'], 'https://app.example.com')
  assert.strictEqual(allowedHeaders['Access-Control-Allow-Credentials'], 'true')
  assert.strictEqual(deniedHeaders['Access-Control-Allow-Origin'], undefined)
  assert.strictEqual(deniedHeaders['Access-Control-Allow-Credentials'], undefined)
}

async function run() {
  testNormalizesOrigins()
  testBuildsUniqueAllowlist()
  testAllowsOnlyConfiguredOrigins()
  await testOriginCheckerCallback()
  await testCorsMiddlewareDoesNotReflectDeniedOrigins()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
