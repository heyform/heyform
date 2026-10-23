import * as assert from 'assert'

// The server's own key isn't used for integrations any more
process.env.FORM_ENCRYPTION_KEY = 'form-key'
delete process.env.INTEGRATION_ENCRYPTION_KEY
delete process.env.INTEGRATION_ENCRYPTION_KEY_PREVIOUS

const {
  IntegrationSecrets,
  IntegrationSecretError,
  integrationSecrets
} = require('../src/service/integration-secrets')
const { AppService } = require('../src/service/app.service')
const {
  IntegrationAuthService,
  IntegrationAuthError
} = require('../src/service/integration-auth.service')
const { AppsResolver } = require('../src/resolver/apps/apps.resolver')
const { defineApp } = require('../src/apps/types')
const { encryptSecret, secretKeyId } = require('../src/utils/crypto')
const { IntegrationStatusEnum } = require('../src/model/integration.model')
const webhook = require('../src/apps/webhook').default

const OLD_KEY = 'old-integration-key'
const NEW_KEY = 'new-integration-key'

const keyApp = defineApp({
  id: 'keyapp',
  name: 'Key App',
  description: '',
  icon: '',
  auth: { type: 'apiKey' },
  settings: [],
  run: async () => undefined
})

const oauthApp = defineApp({
  id: 'fakeapp',
  name: 'Fake App',
  description: '',
  icon: '',
  auth: { type: 'oauth2', provider: 'fake', scopes: ['rows'] },
  settings: [],
  run: async () => undefined
})

function createAppService(secrets: any) {
  const appService = new AppService()
  ;(appService as any).apps = { keyapp: keyApp, fakeapp: oauthApp, webhook }
  appService.providers = {
    fake: {
      id: 'fake',
      name: 'Fake',
      authorizeUrl: 'https://auth.fake.example/authorize',
      tokenUrl: 'http://127.0.0.1:1/token',
      userInfoUrl: 'http://127.0.0.1:1/userinfo',
      identityScopes: ['openid']
    }
  }
  appService.secrets = secrets
  process.env.FAKE_INTEGRATION_CLIENT_ID = 'id'
  process.env.FAKE_INTEGRATION_CLIENT_SECRET = 'secret'

  return appService
}

// --- encryption ----------------------------------------------------------------

function testValuesSayWhichKeyEncryptedThem() {
  const secrets = new IntegrationSecrets(NEW_KEY)
  const value = secrets.encrypt('refresh-token')

  assert.ok(value.startsWith(`${secretKeyId(NEW_KEY)}:`))
  assert.strictEqual(secretKeyId(NEW_KEY).length, 8)
  assert.ok(!value.includes(NEW_KEY), 'a fingerprint, not the key')
  assert.notStrictEqual(secrets.encrypt('refresh-token'), value, 'random IV')
  assert.strictEqual(secrets.decrypt(value), 'refresh-token')
}

function testThePreviousKeyOnlyReads() {
  const before = new IntegrationSecrets(OLD_KEY)
  const old = before.encrypt('api-key')

  // Rotated: the old key is kept as the previous one
  const rotated = new IntegrationSecrets(NEW_KEY, OLD_KEY)
  assert.strictEqual(rotated.decrypt(old), 'api-key')
  // Writes use the current key
  assert.ok(rotated.encrypt('api-key').startsWith(`${secretKeyId(NEW_KEY)}:`))
  assert.strictEqual(rotated.currentKeyId, secretKeyId(NEW_KEY))

  // Without the previous key, old values can't be read
  assert.throws(
    () => new IntegrationSecrets(NEW_KEY).decrypt(old),
    (error: any) =>
      error instanceof IntegrationSecretError &&
      /neither INTEGRATION_ENCRYPTION_KEY nor INTEGRATION_ENCRYPTION_KEY_PREVIOUS/.test(
        error.message
      )
  )
}

function testDamagedOrForeignValuesAreRejected() {
  const secrets = new IntegrationSecrets(NEW_KEY, OLD_KEY)
  const value = secrets.encrypt('token')
  const [keyId, rest] = [value.slice(0, 8), value.slice(9)]
  const parts = rest.split('.')
  parts[3] = Buffer.from('tampered').toString('base64')

  assert.throws(() => secrets.decrypt(`${keyId}:${parts.join('.')}`), /damaged/)
  // Written before integrations had their own key
  assert.throws(() => secrets.decrypt(encryptSecret('token', 'form-key')), IntegrationSecretError)
  // A key id that matches, with a value from another key
  assert.throws(() => secrets.decrypt(`${keyId}:${encryptSecret('token', 'form-key')}`), /damaged/)
}

function testWithoutAKeyNothingIsWritten() {
  assert.strictEqual(integrationSecrets.isConfigured, false, 'not set in this test')
  assert.throws(() => integrationSecrets.encrypt('x'), /INTEGRATION_ENCRYPTION_KEY is not set/)
  assert.strictEqual(new IntegrationSecrets(undefined, OLD_KEY).isConfigured, false)
}

// --- availability ------------------------------------------------------------

async function testAppsThatStoreCredentialsNeedTheKey() {
  const without = createAppService(new IntegrationSecrets())
  const warnings: string[] = []
  ;(without as any).logger = { warn: (message: string) => warnings.push(message) }

  assert.deepStrictEqual(
    (await new AppsResolver(without).apps()).map((app: any) => app.id),
    ['webhook'],
    'webhook keeps working'
  )
  assert.strictEqual(without.isAvailable(keyApp), false)
  assert.strictEqual(without.isAvailable(oauthApp), false)

  without.onModuleInit()
  assert.strictEqual(warnings.length, 1)
  assert.match(warnings[0], /INTEGRATION_ENCRYPTION_KEY is not set/)
  assert.match(warnings[0], /Key App, Fake App/)

  const configured = createAppService(new IntegrationSecrets(NEW_KEY))
  ;(configured as any).logger = { warn: (message: string) => warnings.push(message) }
  configured.onModuleInit()
  assert.strictEqual(warnings.length, 1, 'no warning with the key set')
  assert.deepStrictEqual(
    (await new AppsResolver(configured).apps()).map((app: any) => app.id).sort(),
    ['fakeapp', 'keyapp', 'webhook']
  )
}

function createAuth(secrets: any) {
  const integrations = new Map<string, any>()
  const integrationService = {
    update: async (id: string, updates: any) => {
      integrations.set(id, { ...integrations.get(id), ...updates })
    }
  }
  const service = new IntegrationAuthService(createAppService(secrets), integrationService, {}, {})

  return { service, integrations }
}

async function testJobsFailWithoutTheKeyButDontNeedReconnecting() {
  const { service, integrations } = createAuth(new IntegrationSecrets())

  for (const app of [keyApp, oauthApp]) {
    await assert.rejects(
      service.getRunAuth(app, { id: 'integration_1', apiKey: 'x' }),
      (error: any) =>
        error instanceof IntegrationAuthError &&
        !error.needsReconnect &&
        /INTEGRATION_ENCRYPTION_KEY is not set on this server/.test(error.message)
    )
  }
  assert.strictEqual(integrations.size, 0, 'nothing marked: reconnecting would not help')
  assert.deepStrictEqual(await service.getRunAuth(webhook, { id: 'integration_2' }), {
    type: 'none'
  })

  assert.throws(() => service.encryptApiKey('key'), /INTEGRATION_ENCRYPTION_KEY is not set/)
  await assert.rejects(
    service.createAuthorization(oauthApp, 'form_1', 'user_1'),
    /not available on this server/
  )
}

async function testAKeyNeitherKeyReadsNeedsReconnecting() {
  const { service, integrations } = createAuth(new IntegrationSecrets(NEW_KEY))
  const lost = new IntegrationSecrets('a-key-nobody-kept').encrypt('api-key')

  await assert.rejects(
    service.getRunAuth(keyApp, { id: 'integration_1', apiKey: lost }),
    (error: any) => {
      assert.ok(error instanceof IntegrationAuthError)
      assert.strictEqual(error.needsReconnect, true)
      assert.match(
        error.message,
        /can't be decrypted with INTEGRATION_ENCRYPTION_KEY or INTEGRATION_ENCRYPTION_KEY_PREVIOUS\. Enter it again/
      )
      return true
    }
  )
  assert.strictEqual(
    integrations.get('integration_1').status,
    IntegrationStatusEnum.NEEDS_RECONNECT
  )

  // A key on the previous key still works
  const rotated = createAuth(new IntegrationSecrets(NEW_KEY, OLD_KEY))
  assert.deepStrictEqual(
    await rotated.service.getRunAuth(keyApp, {
      id: 'integration_2',
      apiKey: new IntegrationSecrets(OLD_KEY).encrypt('old-api-key')
    }),
    { type: 'apiKey', apiKey: 'old-api-key' }
  )
}

async function run() {
  testValuesSayWhichKeyEncryptedThem()
  testThePreviousKeyOnlyReads()
  testDamagedOrForeignValuesAreRejected()
  testWithoutAKeyNothingIsWritten()
  await testAppsThatStoreCredentialsNeedTheKey()
  await testJobsFailWithoutTheKeyButDontNeedReconnecting()
  await testAKeyNeitherKeyReadsNeedsReconnecting()
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
