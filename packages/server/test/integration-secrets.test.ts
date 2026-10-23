import * as assert from 'assert'

// The server's own key isn't used for integrations any more
process.env.FORM_ENCRYPTION_KEY = 'form-key'
delete process.env.INTEGRATION_ENCRYPTION_KEY
delete process.env.INTEGRATION_ENCRYPTION_KEY_PREVIOUS

const {
  IntegrationSecrets,
  IntegrationSecretError,
  integrationSecrets,
  reencryptIntegrationSecrets
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

// --- re-encryption -------------------------------------------------------------

function createModel(docs: any[]) {
  const updates: any[] = []
  const matches = (doc: any, filter: any) =>
    Object.entries(filter).every(([key, value]: [string, any]) => {
      if (value && typeof value === 'object' && '$exists' in value) {
        return value.$exists ? doc[key] != null : doc[key] == null
      }
      return doc[key] === value
    })

  return {
    docs,
    updates,
    find: (filter: any) => ({ lean: async () => docs.filter(doc => matches(doc, filter)) }),
    updateOne: async (filter: any, update: any) => {
      updates.push(filter)
      const doc = docs.find(row => matches(row, filter))

      if (!doc) {
        return { modifiedCount: 0 }
      }

      Object.assign(doc, update.$set)
      if (update.$inc) {
        doc.tokenVersion += update.$inc.tokenVersion
      }
      return { modifiedCount: 1 }
    }
  }
}

async function testReencryptionMovesEverythingToTheCurrentKey() {
  const old = new IntegrationSecrets(OLD_KEY)
  const current = new IntegrationSecrets(NEW_KEY, OLD_KEY)
  const connections = createModel([
    {
      _id: 'connection_old',
      tokenVersion: 4,
      tokens: new Map([
        ['accessToken', old.encrypt('access-1')],
        ['refreshToken', old.encrypt('refresh-1')],
        ['expiresAt', 1234]
      ])
    },
    // Refreshed since the rotation: already on the current key
    {
      _id: 'connection_new',
      tokenVersion: 1,
      tokens: {
        accessToken: current.encrypt('access-2'),
        refreshToken: current.encrypt('refresh-2')
      }
    },
    // Encrypted with a key nobody kept
    {
      _id: 'connection_lost',
      tokenVersion: 0,
      tokens: { refreshToken: new IntegrationSecrets('lost').encrypt('refresh-3') }
    }
  ])
  const integrations = createModel([
    { _id: 'integration_old', apiKey: old.encrypt('api-key-1') },
    { _id: 'integration_new', apiKey: current.encrypt('api-key-2') },
    { _id: 'integration_none' }
  ])

  const result = await reencryptIntegrationSecrets(
    { connectionModel: connections, integrationModel: integrations },
    current
  )

  assert.deepStrictEqual(result, { reencrypted: 2, skipped: 0, unreadable: 1 })

  const moved = connections.docs[0]
  const newId = secretKeyId(NEW_KEY)
  assert.ok(moved.tokens.accessToken.startsWith(`${newId}:`))
  assert.ok(moved.tokens.refreshToken.startsWith(`${newId}:`))
  assert.strictEqual(
    new IntegrationSecrets(NEW_KEY).decrypt(moved.tokens.refreshToken),
    'refresh-1'
  )
  assert.strictEqual(moved.tokens.expiresAt, 1234)
  assert.strictEqual(moved.tokenVersion, 5)
  // Updates only apply to what was read
  assert.deepStrictEqual(connections.updates, [{ _id: 'connection_old', tokenVersion: 4 }])
  assert.strictEqual(
    new IntegrationSecrets(NEW_KEY).decrypt(integrations.docs[0].apiKey),
    'api-key-1'
  )
  assert.deepStrictEqual(
    integrations.updates.map((filter: any) => filter._id),
    ['integration_old']
  )

  // Running it again finds nothing left to move
  assert.deepStrictEqual(
    await reencryptIntegrationSecrets(
      { connectionModel: connections, integrationModel: integrations },
      current
    ),
    { reencrypted: 0, skipped: 0, unreadable: 1 }
  )
}

async function testReencryptionSkipsValuesThatChangedMeanwhile() {
  const old = new IntegrationSecrets(OLD_KEY)
  const current = new IntegrationSecrets(NEW_KEY, OLD_KEY)
  const connections = createModel([
    { _id: 'connection_1', tokenVersion: 2, tokens: { refreshToken: old.encrypt('r') } }
  ])
  const integrations = createModel([{ _id: 'integration_1', apiKey: old.encrypt('k') }])
  // A refresh and a key change land between the read and the write
  const find = connections.find
  connections.find = (filter: any) => ({
    lean: async () => {
      const rows = (await find(filter).lean()).map((row: any) => ({ ...row }))
      connections.docs[0].tokenVersion = 3
      return rows
    }
  })
  const findIntegrations = integrations.find
  integrations.find = (filter: any) => ({
    lean: async () => {
      const rows = (await findIntegrations(filter).lean()).map((row: any) => ({ ...row }))
      integrations.docs[0].apiKey = current.encrypt('new-key')
      return rows
    }
  })

  assert.deepStrictEqual(
    await reencryptIntegrationSecrets(
      { connectionModel: connections, integrationModel: integrations },
      current
    ),
    { reencrypted: 0, skipped: 2, unreadable: 0 }
  )
  assert.strictEqual(current.decrypt(integrations.docs[0].apiKey), 'new-key', 'not overwritten')

  await assert.rejects(
    reencryptIntegrationSecrets(
      { connectionModel: connections, integrationModel: integrations },
      new IntegrationSecrets(undefined, OLD_KEY)
    ),
    /INTEGRATION_ENCRYPTION_KEY is not set/
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
  await testReencryptionMovesEverythingToTheCurrentKey()
  await testReencryptionSkipsValuesThatChangedMeanwhile()
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
