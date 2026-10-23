import * as assert from 'assert'
import * as crypto from 'crypto'
import * as http from 'http'
import { AddressInfo } from 'net'

import type { AppDefinition } from '../src/apps/types'

// Set before the server modules read them
process.env.INTEGRATION_ENCRYPTION_KEY = 'integration-auth-test-key'
process.env.APP_HOMEPAGE_URL = 'https://heyform.example.com'
process.env.FAKE_INTEGRATION_CLIENT_ID = 'fake-client-id'
process.env.FAKE_INTEGRATION_CLIENT_SECRET = 'fake-client-secret'

const { BadRequestException, ForbiddenException } = require('@nestjs/common')
const { defineApp } = require('../src/apps/types')
const { AppService } = require('../src/service/app.service')
const { IntegrationService, getAppJobOptions } = require('../src/service/integration.service')
const {
  IntegrationAuthError,
  IntegrationAuthService,
  OAuth2TokenError,
  maskApiKey
} = require('../src/service/integration-auth.service')
const { IntegrationQueue } = require('../src/queue/integration-queue')
const { AppsResolver } = require('../src/resolver/apps/apps.resolver')
const { FormIntegrationsResolver } = require('../src/resolver/form/form-integrations.resolver')
const {
  UpdateIntegrationSettingsResolver
} = require('../src/resolver/integration/update-integration-settings.resolver')
const {
  DeleteIntegrationSettingsResolver
} = require('../src/resolver/integration/delete-integration-settings.resolver')
const {
  UpdateIntegrationStatusResolver
} = require('../src/resolver/integration/update-integration-status.resolver')
const {
  IntegrationConnectionsResolver
} = require('../src/resolver/integration/integration-connections.resolver')
const {
  TeamIntegrationConnectionsResolver
} = require('../src/resolver/integration/team-integration-connections.resolver')
const {
  DisconnectIntegrationConnectionResolver
} = require('../src/resolver/integration/disconnect-integration-connection.resolver')
const {
  IntegrationSettingOptionsResolver
} = require('../src/resolver/integration/integration-setting-options.resolver')
const { AppError } = require('../src/apps/types')
const {
  IntegrationOAuthCallbackController,
  IntegrationOAuthController
} = require('../src/controller/integration-oauth.controller')
const { decryptSecret, encryptSecret } = require('../src/utils/crypto')
const { IntegrationSecrets, integrationSecrets } = require('../src/service/integration-secrets')
const { secretKeyId } = require('../src/utils/crypto')
const { IntegrationStatusEnum } = require('../src/model/integration.model')
const { IntegrationConnectionStatusEnum } = require('../src/model/integration-connection.model')
const webhook = require('../src/apps/webhook').default

const NEEDS_RECONNECT = IntegrationStatusEnum.NEEDS_RECONNECT
const CONNECTION_ACTIVE = IntegrationConnectionStatusEnum.ACTIVE
const CONNECTION_NEEDS_RECONNECT = IntegrationConnectionStatusEnum.NEEDS_RECONNECT

// --- fake OAuth2 provider ---------------------------------------------------

interface ProviderRequest {
  path: string
  params: Record<string, string>
  authorization?: string
}

type TokenHandler = (
  params: Record<string, string>,
  path: string
) => { status: number; body: unknown }

const ACCOUNT = { sub: 'account-1', email: 'owner@example.com', name: 'Owner' }

class FakeProvider {
  requests: ProviderRequest[] = []
  handler: TokenHandler = () => ({ status: 500, body: {} })
  userInfo: () => { status: number; body: unknown } = () => ({ status: 200, body: ACCOUNT })
  private server = http.createServer((req, res) => {
    let raw = ''
    req.on('data', chunk => (raw += chunk))
    req.on('end', () => {
      const params = Object.fromEntries(new URLSearchParams(raw))
      const path = req.url ?? ''
      this.requests.push({ path, params, authorization: req.headers.authorization })

      const { status, body } = path === '/userinfo' ? this.userInfo() : this.handler(params, path)
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify(body))
    })
  })

  async start(): Promise<void> {
    await new Promise<void>(resolve => this.server.listen(0, '127.0.0.1', resolve))
  }

  async stop(): Promise<void> {
    await new Promise(resolve => this.server.close(resolve))
  }

  private url(path: string): string {
    return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}${path}`
  }

  get tokenUrl(): string {
    return this.url('/token')
  }

  get revokeUrl(): string {
    return this.url('/revoke')
  }

  get userInfoUrl(): string {
    return this.url('/userinfo')
  }

  get tokenRequests(): ProviderRequest[] {
    return this.requests.filter(r => r.path === '/token')
  }

  get revokeRequests(): ProviderRequest[] {
    return this.requests.filter(r => r.path === '/revoke')
  }
}

const provider = new FakeProvider()

// --- in-memory services -----------------------------------------------------

function createStores() {
  let nextId = 1
  const integrations = new Map<string, any>()
  const connections = new Map<string, any>()
  const redis = new Map<string, string>()
  // Integrations whose waiting submissions were resent
  const resent: string[] = []
  // Submissions kept waiting for a reconnect
  const held: any[] = []
  // Keys locked with withLock, in order
  const locks: string[] = []
  const lockQueues = new Map<string, Promise<unknown>>()

  const integrationService = {
    findById: async (id: string) => integrations.get(id) ?? null,
    findOne: async (formId: string, appId: string) =>
      [...integrations.values()].find(i => i.formId === formId && i.appId === appId) ?? null,
    findAllInForm: async (formId: string) =>
      [...integrations.values()].filter(i => i.formId === formId),
    findAllByConnection: async (connectionId: string) =>
      [...integrations.values()].filter(i => i.connectionId === connectionId),
    findAllByConnections: async (ids: string[]) =>
      [...integrations.values()].filter(i => ids.includes(i.connectionId)),
    create: async (data: any) => {
      const id = `integration_${nextId++}`
      integrations.set(id, { ...data, id })
      return id
    },
    update: async (id: string, updates: any) => {
      integrations.set(id, { ...integrations.get(id), ...updates })
      return true
    },
    createOrUpdate: async (formId: string, appId: string, updates: any) => {
      const existing = await integrationService.findOne(formId, appId)

      if (existing) {
        await integrationService.update(existing.id, updates)
        return existing.id
      }

      return integrationService.create({ formId, appId, ...updates })
    },
    markConnectionNeedsReconnect: async (connectionId: string) => {
      for (const i of integrations.values()) {
        if (i.connectionId === connectionId && i.status === IntegrationStatusEnum.ACTIVE) {
          i.status = NEEDS_RECONNECT
        }
      }
    },
    detachConnection: async (connectionId: string) => {
      await integrationService.markConnectionNeedsReconnect(connectionId)
      for (const i of integrations.values()) {
        if (i.connectionId === connectionId) {
          delete i.connectionId
        }
      }
    },
    countWaiting: async () => 0,
    holdForReconnect: async (input: any) => {
      held.push(input)
      return true
    },
    resendWaiting: async (integration: any) => {
      resent.push(integration.id)
      return 0
    }
  }

  // Copies, like documents read from MongoDB
  const read = (connection: any) =>
    connection ? { ...connection, tokens: { ...connection.tokens } } : null

  const connectionService = {
    findById: async (id: string) => read(connections.get(id)),
    findAccount: async (teamId: string, providerId: string, accountId: string) =>
      read(
        [...connections.values()].find(
          c => c.teamId === teamId && c.provider === providerId && c.accountId === accountId
        )
      ),
    findAllInTeam: async (teamId: string, providerId?: string) =>
      [...connections.values()]
        .filter(c => c.teamId === teamId && (!providerId || c.provider === providerId))
        .map(read),
    create: async (data: any) => {
      const id = `connection_${nextId++}`
      connections.set(id, {
        tokenVersion: 0,
        status: CONNECTION_ACTIVE,
        scopes: [],
        ...data,
        id
      })
      return id
    },
    reconnect: async (id: string, updates: any) => {
      const connection = connections.get(id)
      Object.assign(connection, updates, { status: CONNECTION_ACTIVE })
      delete connection.statusReason
      connection.tokenVersion++
    },
    updateTokens: async (id: string, tokenVersion: number, tokens: any) => {
      const connection = connections.get(id)

      if (!connection || connection.tokenVersion !== tokenVersion) {
        return false
      }

      connection.tokens = tokens
      connection.tokenVersion++
      return true
    },
    markNeedsReconnect: async (id: string, tokenVersion: number, reason: string) => {
      const connection = connections.get(id)

      if (!connection || connection.tokenVersion !== tokenVersion) {
        return false
      }

      connection.status = CONNECTION_NEEDS_RECONNECT
      connection.statusReason = reason
      return true
    },
    accountConnectedElsewhere: async (providerId: string, accountId: string, exceptId: string) =>
      [...connections.values()].some(
        c => c.provider === providerId && c.accountId === accountId && c.id !== exceptId
      ),
    delete: async (id: string) => connections.delete(id)
  }

  const redisService = {
    set: async ({ key, value }: { key: string; value: string }) => {
      redis.set(key, value)
      return 'OK'
    },
    getdel: async (key: string) => {
      const value = redis.get(key) ?? null
      redis.delete(key)
      return value
    },
    // Runs callbacks for the same key one after another, like the Redis lock
    withLock: async (key: string, _ttl: string, callback: () => Promise<any>) => {
      locks.push(key)
      const previous = lockQueues.get(key) ?? Promise.resolve()
      const run = previous.catch(() => undefined).then(callback)
      lockQueues.set(key, run)
      return run
    }
  }

  return {
    integrations,
    connections,
    redis,
    resent,
    held,
    locks,
    integrationService,
    connectionService,
    redisService
  }
}

const oauthApp: AppDefinition = defineApp({
  id: 'fakeapp',
  name: 'Fake App',
  description: 'Uses the fake provider',
  icon: '/static/fake.png',
  auth: { type: 'oauth2', provider: 'fake', scopes: ['rows.read', 'rows.write'] },
  settings: [{ type: 'text', name: 'sheet', label: 'Sheet', required: true }],
  run: async () => undefined
})

const apiKeyApp: AppDefinition = defineApp({
  id: 'keyapp',
  name: 'Key App',
  description: 'Uses an API key',
  icon: '/static/key.png',
  auth: { type: 'apiKey', label: 'Secret token' },
  settings: [{ type: 'text', name: 'list', label: 'List', required: true }],
  run: async () => undefined
})

function createAppService(apps: AppDefinition[] = [oauthApp, apiKeyApp, webhook]) {
  const appService = new AppService()
  ;(appService as any).apps = Object.fromEntries(apps.map(app => [app.id, app]))
  appService.providers = {
    fake: {
      id: 'fake',
      name: 'Fake',
      authorizeUrl: 'https://auth.fake.example/authorize',
      tokenUrl: provider.tokenUrl,
      userInfoUrl: provider.userInfoUrl,
      identityScopes: ['openid', 'email'],
      revokeUrl: provider.revokeUrl,
      authorizeParams: { access_type: 'offline' },
      pkce: true
    },
    unconfigured: {
      id: 'unconfigured',
      name: 'Unconfigured',
      authorizeUrl: 'https://auth.unconfigured.example/authorize',
      tokenUrl: provider.tokenUrl,
      userInfoUrl: provider.userInfoUrl,
      identityScopes: ['openid']
    }
  }

  return appService
}

function createAuth() {
  const stores = createStores()
  const appService = createAppService()
  const service = new IntegrationAuthService(
    appService,
    stores.integrationService,
    stores.connectionService,
    stores.redisService
  )

  return { ...stores, appService, service }
}

const FORM = { id: 'form_1', teamId: 'team_1' }

function encryptTokens(tokens: {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}) {
  return {
    accessToken: tokens.accessToken ? integrationSecrets.encrypt(tokens.accessToken) : undefined,
    refreshToken: tokens.refreshToken ? integrationSecrets.encrypt(tokens.refreshToken) : undefined,
    expiresAt: tokens.expiresAt
  }
}

// Stores a team connection and an integration using it, as connecting would
async function connect(
  ctx: ReturnType<typeof createAuth>,
  tokens: { accessToken?: string; refreshToken?: string; expiresAt?: number },
  integration: Record<string, any> = {},
  connection: Record<string, any> = {}
) {
  const connectionId = await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'fake',
    accountId: 'account-1',
    accountEmail: 'owner@example.com',
    scopes: ['openid', 'email', 'rows.read', 'rows.write'],
    createdBy: 'user_1',
    tokens: encryptTokens(tokens),
    ...connection
  })
  const integrationId = await ctx.integrationService.create({
    formId: 'form_1',
    appId: 'fakeapp',
    config: { sheet: 'Leads' },
    status: IntegrationStatusEnum.ACTIVE,
    connectionId,
    ...integration
  })

  return {
    connectionId,
    integrationId,
    integration: ctx.integrations.get(integrationId),
    connection: ctx.connections.get(connectionId)
  }
}

function storedTokens(ctx: ReturnType<typeof createAuth>, connectionId: string) {
  const tokens = ctx.connections.get(connectionId).tokens

  return {
    raw: tokens,
    accessToken: tokens.accessToken && integrationSecrets.decrypt(tokens.accessToken),
    refreshToken: tokens.refreshToken && integrationSecrets.decrypt(tokens.refreshToken),
    expiresAt: tokens.expiresAt
  }
}

async function assertBadRequest(promise: Promise<unknown>, message: RegExp) {
  await assert.rejects(promise, (error: any) => {
    assert.ok(error instanceof BadRequestException, `expected BadRequestException, got ${error}`)
    assert.match(error.message, message)
    return true
  })
}

// --- defineApp --------------------------------------------------------------

function testDefineAppValidatesAuthAndQueue() {
  const base = {
    id: 'bad',
    name: 'Bad',
    description: '',
    icon: '',
    settings: [],
    run: async () => undefined
  }

  assert.deepStrictEqual(oauthApp.auth, {
    type: 'oauth2',
    provider: 'fake',
    scopes: ['rows.read', 'rows.write']
  })
  assert.throws(
    () => defineApp({ ...base, auth: { type: 'oauth2', provider: 'fake', scopes: [] } }),
    /needs a provider and at least one scope/
  )

  for (const queue of [{ attempts: 0 }, { attempts: 1.5 }, { timeout: -1 }]) {
    assert.throws(() => defineApp({ ...base, queue }), /queue\.(attempts|timeout)/)
  }

  for (const backoff of [-1, { type: 'linear', delay: 1 }, { type: 'fixed' }]) {
    assert.throws(() => defineApp({ ...base, queue: { backoff } as any }), /queue\.backoff/)
  }

  defineApp({ ...base, queue: { attempts: 5, backoff: 0, timeout: 1000 } })
}

// --- crypto -----------------------------------------------------------------

function testEncryptSecret() {
  const first = encryptSecret('refresh-token-value', 'key')
  const second = encryptSecret('refresh-token-value', 'key')

  assert.notStrictEqual(first, second, 'each encryption uses a fresh IV')
  assert.ok(!first.includes('refresh-token-value'))
  assert.strictEqual(decryptSecret(first, 'key'), 'refresh-token-value')
  assert.throws(() => decryptSecret(first, 'other-key'))

  const parts = first.split('.')
  const data = Buffer.from(parts[3], 'base64')
  data[0] ^= 1
  parts[3] = data.toString('base64')
  assert.throws(() => decryptSecret(parts.join('.'), 'key'), 'tampering is detected')

  // A truncated tag is rejected rather than checked with fewer bits
  const truncated = first.split('.')
  truncated[2] = Buffer.from(truncated[2], 'base64').subarray(0, 4).toString('base64')
  assert.throws(() => decryptSecret(truncated.join('.'), 'key'), /Invalid encrypted secret/)
}

// --- queue options ----------------------------------------------------------

function testAppJobOptions() {
  assert.deepStrictEqual(getAppJobOptions(webhook), {})
  assert.deepStrictEqual(getAppJobOptions({ ...oauthApp, queue: { attempts: 5 } }), {
    attempts: 5
  })
  assert.deepStrictEqual(
    getAppJobOptions({
      ...oauthApp,
      queue: { attempts: 8, backoff: { type: 'exponential', delay: 2000 }, timeout: 30000 }
    }),
    { attempts: 8, backoff: { type: 'exponential', delay: 2000 }, timeout: 30000 }
  )
  assert.deepStrictEqual(getAppJobOptions({ ...oauthApp, queue: { backoff: 500 } }), {
    backoff: { type: 'fixed', delay: 500 }
  })
}

async function testAddQueueAppliesAppOptions() {
  const queuedApp = { ...oauthApp, queue: { attempts: 6, timeout: 45000 } }
  const added: any[] = []
  const integrationModel = {
    find: async () => [
      { id: 'integration_1', appId: 'fakeapp' },
      { id: 'integration_2', appId: 'webhook' },
      { id: 'integration_3', appId: 'removed' }
    ]
  }
  const queue = { add: (data: any, options: any) => added.push({ data, options }) }
  const service = new IntegrationService(
    integrationModel,
    {},
    createAppService([queuedApp, webhook]),
    queue,
    { add: () => undefined }
  )

  await service.addQueue({ id: 'form_1', settings: {} }, 'submission_1')

  assert.deepStrictEqual(added, [
    {
      data: {
        appId: 'fakeapp',
        formId: 'form_1',
        integrationId: 'integration_1',
        submissionId: 'submission_1'
      },
      options: { attempts: 6, timeout: 45000, jobId: 'integration_1-submission_1' }
    },
    {
      data: {
        appId: 'webhook',
        formId: 'form_1',
        integrationId: 'integration_2',
        submissionId: 'submission_1'
      },
      // Only the job id; the queue's defaults apply
      options: { jobId: 'integration_2-submission_1' }
    }
  ])
}

// --- availability -----------------------------------------------------------

async function testHidesAppsWithoutProviderCredentials() {
  const unconfigured = defineApp({
    ...oauthApp,
    id: 'unconfiguredapp',
    auth: { type: 'oauth2', provider: 'unconfigured', scopes: ['x'] }
  })
  const unknownProvider = defineApp({
    ...oauthApp,
    id: 'unknownapp',
    auth: { type: 'oauth2', provider: 'constructor', scopes: ['x'] }
  })
  const appService = createAppService([oauthApp, apiKeyApp, webhook, unconfigured, unknownProvider])
  const apps = await new AppsResolver(appService).apps()

  assert.deepStrictEqual(
    apps.map((app: any) => [app.id, app.auth]),
    [
      ['fakeapp', { type: 'oauth2', provider: 'fake', providerName: 'Fake' }],
      ['keyapp', { type: 'apiKey', label: 'Secret token', description: undefined }],
      ['webhook', { type: 'none' }]
    ]
  )
  assert.strictEqual(appService.isAvailable(unconfigured), false)
}

// --- API keys ---------------------------------------------------------------

function createSettingsResolver(ctx: ReturnType<typeof createAuth>) {
  return new UpdateIntegrationSettingsResolver(ctx.appService, ctx.integrationService, ctx.service)
}

async function testApiKeyIsStoredEncryptedAndNeverReturned() {
  const ctx = createAuth()
  const resolver = createSettingsResolver(ctx)
  const apiKey = 'test-api-key-0123456789-WXYZ'

  await assertBadRequest(
    resolver.updateIntegrationSettings({
      formId: 'form_1',
      appId: 'keyapp',
      config: { list: 'a' }
    }),
    /Secret token is required/
  )

  await resolver.updateIntegrationSettings({
    formId: 'form_1',
    appId: 'keyapp',
    config: { list: 'a', apiKey: 'in-config' },
    apiKey
  })

  const [integration] = ctx.integrations.values()
  assert.deepStrictEqual(integration.config, { list: 'a' }, 'the key never lands in config')
  assert.ok(!JSON.stringify(integration).includes(apiKey), 'stored encrypted')
  assert.strictEqual(integration.apiKeyHint, '••••WXYZ')

  const [listed] = await new FormIntegrationsResolver(ctx.integrationService).formIntegrations({
    formId: 'form_1'
  })
  assert.deepStrictEqual(listed, {
    formId: 'form_1',
    appId: 'keyapp',
    config: { list: 'a' },
    status: IntegrationStatusEnum.ACTIVE,
    connected: false,
    connectionId: undefined,
    apiKeyHint: '••••WXYZ',
    waitingCount: 0
  })
  assert.ok(!JSON.stringify(listed).includes(integration.apiKey), 'ciphertext not returned')

  // Saving again without a key keeps the stored one
  await resolver.updateIntegrationSettings({
    formId: 'form_1',
    appId: 'keyapp',
    config: { list: 'b' }
  })
  assert.deepStrictEqual(
    await ctx.service.getRunAuth(apiKeyApp, ctx.integrations.get(integration.id)),
    {
      type: 'apiKey',
      apiKey
    }
  )
}

function testMaskApiKey() {
  assert.strictEqual(maskApiKey('0123456789abcdef'), '••••cdef')
  assert.strictEqual(maskApiKey('short-key'), '••••')
}

async function testMissingApiKeyFailsWithoutRetry() {
  const { service } = createAuth()

  await assert.rejects(
    service.getRunAuth(apiKeyApp, { id: 'i', apiKey: undefined }),
    (error: any) => error instanceof IntegrationAuthError && !error.needsReconnect
  )
}

async function testUnreadableApiKeyNeedsANewKey() {
  const ctx = createAuth()
  const resolver = createSettingsResolver(ctx)
  const integrationId = await ctx.integrationService.create({
    formId: 'form_1',
    appId: 'keyapp',
    config: { list: 'a' },
    status: IntegrationStatusEnum.ACTIVE,
    // Encrypted with an INTEGRATION_ENCRYPTION_KEY that has since changed
    apiKey: encryptSecret('k', 'other-key'),
    apiKeyHint: '••••'
  })

  await assert.rejects(
    ctx.service.getRunAuth(apiKeyApp, ctx.integrations.get(integrationId)),
    (error: any) =>
      error instanceof IntegrationAuthError &&
      error.needsReconnect &&
      /Enter it again/.test(error.message)
  )
  assert.strictEqual(ctx.integrations.get(integrationId).status, NEEDS_RECONNECT)

  // Saving without a key leaves the unreadable one, so it still needs one
  await resolver.updateIntegrationSettings({
    formId: 'form_1',
    appId: 'keyapp',
    config: { list: 'b' }
  })
  assert.strictEqual(ctx.integrations.get(integrationId).status, NEEDS_RECONNECT)
  assert.deepStrictEqual(ctx.resent, [])

  // A new key reconnects it and sends what waited
  await resolver.updateIntegrationSettings({
    formId: 'form_1',
    appId: 'keyapp',
    config: { list: 'b' },
    apiKey: 'test-api-key-0123456789-NEW1'
  })
  assert.strictEqual(ctx.integrations.get(integrationId).status, IntegrationStatusEnum.ACTIVE)
  assert.deepStrictEqual(ctx.resent, [integrationId])
}

// --- OAuth2 connect ---------------------------------------------------------

async function testAuthorizeUrlAndState() {
  const ctx = createAuth()
  const { url, state } = await ctx.service.createAuthorization(
    oauthApp,
    'form_1',
    'user_1',
    'device_1'
  )
  const parsed = new URL(url)
  const stored = JSON.parse(ctx.redis.get(`integration_oauth_state:${state}`)!)

  assert.strictEqual(parsed.origin + parsed.pathname, 'https://auth.fake.example/authorize')
  assert.strictEqual(parsed.searchParams.get('client_id'), 'fake-client-id')
  assert.strictEqual(
    parsed.searchParams.get('redirect_uri'),
    'https://heyform.example.com/api/integrations/oauth/callback'
  )
  assert.strictEqual(parsed.searchParams.get('response_type'), 'code')
  // The identity scopes come first, so the account can be identified
  assert.strictEqual(parsed.searchParams.get('scope'), 'openid email rows.read rows.write')
  assert.strictEqual(parsed.searchParams.get('state'), state)
  assert.strictEqual(parsed.searchParams.get('access_type'), 'offline')
  assert.ok(!url.includes('fake-client-secret'), 'the client secret stays on the server')
  assert.ok(state.length >= 43)

  // PKCE: the challenge is the S256 hash of the verifier kept server-side
  assert.strictEqual(parsed.searchParams.get('code_challenge_method'), 'S256')
  assert.strictEqual(
    parsed.searchParams.get('code_challenge'),
    crypto.createHash('sha256').update(stored.codeVerifier).digest('base64url')
  )
  assert.deepStrictEqual(
    { ...stored, codeVerifier: undefined },
    {
      appId: 'fakeapp',
      formId: 'form_1',
      userId: 'user_1',
      deviceId: 'device_1',
      codeVerifier: undefined
    }
  )

  await assertBadRequest(
    ctx.service.createAuthorization(
      { ...oauthApp, auth: { type: 'oauth2', provider: 'unconfigured', scopes: ['x'] } },
      'form_1',
      'user_1',
      'device_1'
    ),
    /not available on this server/
  )
}

async function testStateIsBoundToUserAndSingleUse() {
  const ctx = createAuth()
  const { state } = await ctx.service.createAuthorization(oauthApp, 'form_1', 'user_1', 'device_1')

  await assertBadRequest(
    ctx.service.consumeAuthorization(state, 'user_2', 'device_1'),
    /Invalid OAuth state/
  )

  // The failed attempt consumed it too, so a stolen state can't be retried
  await assertBadRequest(
    ctx.service.consumeAuthorization(state, 'user_1', 'device_1'),
    /Invalid OAuth state/
  )

  // The same user on another device (another browser's session)
  const other = await ctx.service.createAuthorization(oauthApp, 'form_1', 'user_1', 'device_1')
  await assertBadRequest(
    ctx.service.consumeAuthorization(other.state, 'user_1', 'device_2'),
    /Invalid OAuth state/
  )

  const second = await ctx.service.createAuthorization(oauthApp, 'form_1', 'user_1', 'device_1')
  const data = await ctx.service.consumeAuthorization(second.state, 'user_1', 'device_1')
  assert.strictEqual(data.formId, 'form_1')
  await assertBadRequest(
    ctx.service.consumeAuthorization(second.state, 'user_1', 'device_1'),
    /Invalid OAuth state/
  )
  await assertBadRequest(
    ctx.service.consumeAuthorization('', 'user_1', 'device_1'),
    /Invalid OAuth state/
  )
}

function grantTokens(extra: Record<string, unknown> = {}) {
  provider.handler = () => ({
    status: 200,
    body: {
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      expires_in: 3600,
      scope: 'openid email rows.read rows.write',
      ...extra
    }
  })
}

async function testConnectingCreatesATeamConnection() {
  const ctx = createAuth()
  provider.requests = []
  provider.userInfo = () => ({ status: 200, body: ACCOUNT })
  grantTokens()

  const connectionId = await ctx.service.completeAuthorization(
    oauthApp,
    FORM,
    'user_1',
    'code-1',
    'verifier-1'
  )

  assert.deepStrictEqual(provider.tokenRequests[0].params, {
    grant_type: 'authorization_code',
    code: 'code-1',
    redirect_uri: 'https://heyform.example.com/api/integrations/oauth/callback',
    code_verifier: 'verifier-1',
    client_id: 'fake-client-id',
    client_secret: 'fake-client-secret'
  })
  // The account is identified with the new access token
  assert.deepStrictEqual(
    provider.requests.filter(r => r.path === '/userinfo').map(r => r.authorization),
    ['Bearer access-1']
  )

  const connection = ctx.connections.get(connectionId)
  assert.deepStrictEqual(
    {
      teamId: connection.teamId,
      provider: connection.provider,
      accountId: connection.accountId,
      accountEmail: connection.accountEmail,
      accountName: connection.accountName,
      createdBy: connection.createdBy,
      scopes: connection.scopes,
      status: connection.status
    },
    {
      teamId: 'team_1',
      provider: 'fake',
      accountId: 'account-1',
      accountEmail: 'owner@example.com',
      accountName: 'Owner',
      createdBy: 'user_1',
      scopes: ['openid', 'email', 'rows.read', 'rows.write'],
      status: CONNECTION_ACTIVE
    }
  )
  assert.ok(!JSON.stringify(connection).includes('access-1'), 'stored encrypted')
  assert.ok(!JSON.stringify(connection).includes('refresh-1'))

  const tokens = storedTokens(ctx, connectionId)
  assert.strictEqual(tokens.accessToken, 'access-1')
  assert.strictEqual(tokens.refreshToken, 'refresh-1')
  assert.ok(Math.abs(tokens.expiresAt - (Date.now() + 3600_000)) < 5000)

  // The form's integration uses it, pending until its settings are saved
  const [integration] = ctx.integrations.values()
  assert.strictEqual(integration.connectionId, connectionId)
  assert.strictEqual(integration.status, IntegrationStatusEnum.PENDING)
  assert.deepStrictEqual(ctx.resent, [], 'nothing to send until it is active')

  const [listed] = await new FormIntegrationsResolver(ctx.integrationService).formIntegrations({
    formId: 'form_1'
  })
  assert.strictEqual(listed.connected, true)
  assert.strictEqual(listed.connectionId, connectionId)
  assert.ok(!JSON.stringify(listed).includes('access-1'))
}

async function testRejectsConnectionsThatCantBeUsed() {
  const ctx = createAuth()

  // An expiring token without a refresh token
  provider.handler = () => ({
    status: 200,
    body: { access_token: 'a', expires_in: 3600, scope: 'openid email rows.read rows.write' }
  })
  await assert.rejects(
    ctx.service.completeAuthorization(oauthApp, FORM, 'user_1', 'code-1'),
    (error: any) =>
      error instanceof OAuth2TokenError && /did not return a refresh token/.test(error.message)
  )

  // A permission left unticked on the consent screen
  grantTokens({ scope: 'openid email rows.read' })
  await assert.rejects(
    ctx.service.completeAuthorization(oauthApp, FORM, 'user_1', 'code-2'),
    /didn't grant all the access Fake App needs/
  )

  // The account can't be identified
  grantTokens()
  provider.userInfo = () => ({ status: 401, body: {} })
  await assert.rejects(
    ctx.service.completeAuthorization(oauthApp, FORM, 'user_1', 'code-3'),
    /didn't identify the account: HTTP 401/
  )
  provider.userInfo = () => ({ status: 200, body: { email: 'no-sub@example.com' } })
  await assert.rejects(
    ctx.service.completeAuthorization(oauthApp, FORM, 'user_1', 'code-4'),
    /didn't identify the account/
  )

  assert.strictEqual(ctx.connections.size, 0)
  assert.strictEqual(ctx.integrations.size, 0)
  provider.userInfo = () => ({ status: 200, body: ACCOUNT })

  // A token that doesn't expire needs no refresh token
  provider.handler = () => ({ status: 200, body: { access_token: 'a' } })
  await ctx.service.completeAuthorization(oauthApp, FORM, 'user_1', 'code-5')
  assert.strictEqual(ctx.connections.size, 1)
}

async function testSameAccountSharesOneConnection() {
  const ctx = createAuth()
  grantTokens()
  const first = await ctx.service.completeAuthorization(oauthApp, FORM, 'user_1', 'code-1')

  // Another member connects the same account from another form; no new
  // refresh token comes back this time
  grantTokens({ access_token: 'access-2', refresh_token: undefined })
  const second = await ctx.service.completeAuthorization(
    oauthApp,
    { id: 'form_2', teamId: 'team_1' },
    'user_2',
    'code-2'
  )

  assert.strictEqual(second, first, 'one connection per team and account')
  assert.strictEqual(ctx.connections.size, 1)

  const connection = ctx.connections.get(first)
  assert.strictEqual(connection.createdBy, 'user_1', 'still shown as connected by its creator')
  assert.strictEqual(connection.tokenVersion, 1)
  assert.deepStrictEqual(
    [storedTokens(ctx, first).accessToken, storedTokens(ctx, first).refreshToken],
    ['access-2', 'refresh-1']
  )
  assert.deepStrictEqual(
    [...ctx.integrations.values()].map(i => [i.formId, i.connectionId]),
    [
      ['form_1', first],
      ['form_2', first]
    ]
  )

  // Another account is another connection
  provider.userInfo = () => ({
    status: 200,
    body: { sub: 'account-2', email: 'other@example.com' }
  })
  grantTokens()
  const other = await ctx.service.completeAuthorization(oauthApp, FORM, 'user_1', 'code-3')
  provider.userInfo = () => ({ status: 200, body: ACCOUNT })

  assert.notStrictEqual(other, first)
  assert.strictEqual(ctx.integrations.get('integration_2').connectionId, other, 'form_1 switches')

  // The first account connected again for an app with other scopes keeps
  // what it granted before
  const filesApp = defineApp({
    ...oauthApp,
    id: 'filesapp',
    auth: { type: 'oauth2', provider: 'fake', scopes: ['files.read'] }
  })
  ;(ctx.appService as any).apps.filesapp = filesApp
  grantTokens({ scope: 'openid email files.read' })
  await ctx.service.completeAuthorization(filesApp, FORM, 'user_1', 'code-5')
  assert.deepStrictEqual(ctx.connections.get(first).scopes, [
    'openid',
    'email',
    'rows.read',
    'rows.write',
    'files.read'
  ])

  // The same account in another team is that team's own connection
  grantTokens()
  const otherTeam = await ctx.service.completeAuthorization(
    oauthApp,
    { id: 'form_3', teamId: 'team_2' },
    'user_3',
    'code-4'
  )
  assert.ok(![first, other].includes(otherTeam))
}

async function testReconnectingResumesEveryIntegrationUsingIt() {
  const ctx = createAuth()
  const { connectionId, integrationId } = await connect(
    ctx,
    { accessToken: 'old', refreshToken: 'refresh-old', expiresAt: 1 },
    { status: NEEDS_RECONNECT },
    {
      status: CONNECTION_NEEDS_RECONNECT,
      statusReason: 'Fake rejected the token request: invalid_grant'
    }
  )
  const otherForm = await ctx.integrationService.create({
    formId: 'form_2',
    appId: 'fakeapp',
    config: { sheet: 'Other' },
    status: NEEDS_RECONNECT,
    connectionId
  })
  const disabled = await ctx.integrationService.create({
    formId: 'form_3',
    appId: 'fakeapp',
    config: { sheet: 'Off' },
    status: IntegrationStatusEnum.DISABLED,
    connectionId
  })
  provider.requests = []
  grantTokens({ access_token: 'access-new', refresh_token: undefined })

  await ctx.service.completeAuthorization(oauthApp, FORM, 'user_2', 'code-2')

  const connection = ctx.connections.get(connectionId)
  assert.strictEqual(connection.status, CONNECTION_ACTIVE)
  assert.strictEqual(connection.statusReason, undefined)
  assert.strictEqual(storedTokens(ctx, connectionId).refreshToken, 'refresh-old', 'kept')
  assert.deepStrictEqual(
    [integrationId, otherForm, disabled].map(id => ctx.integrations.get(id).status),
    [IntegrationStatusEnum.ACTIVE, IntegrationStatusEnum.ACTIVE, IntegrationStatusEnum.DISABLED]
  )
  // Both forms send what waited
  assert.deepStrictEqual(ctx.resent.sort(), [integrationId, otherForm].sort())
  // The same account's new tokens share its grant: nothing revoked
  assert.deepStrictEqual(provider.revokeRequests, [])
}

// --- picking an account -----------------------------------------------------

async function testSettingsPickOneOfTheTeamsAccounts() {
  const ctx = createAuth()
  const resolver = createSettingsResolver(ctx)
  const save = (input: Record<string, any> = {}, form = FORM) =>
    resolver.updateIntegrationSettings(
      { formId: 'form_1', appId: 'fakeapp', config: { sheet: 'Leads' }, ...input },
      form
    )

  await assertBadRequest(save(), /Connect your Fake account first/)

  const otherTeam = await ctx.connectionService.create({
    teamId: 'team_2',
    provider: 'fake',
    accountId: 'account-9',
    scopes: ['rows.read', 'rows.write'],
    createdBy: 'user_9',
    tokens: {}
  })
  await assertBadRequest(save({ connectionId: otherTeam }), /Connect your Fake account first/)

  const otherProvider = await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'unconfigured',
    accountId: 'account-1',
    scopes: ['rows.read', 'rows.write'],
    createdBy: 'user_1',
    tokens: {}
  })
  await assertBadRequest(save({ connectionId: otherProvider }), /Connect your Fake account first/)

  const readOnly = await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'fake',
    accountId: 'account-2',
    scopes: ['rows.read'],
    createdBy: 'user_2',
    tokens: {}
  })
  await assertBadRequest(
    save({ connectionId: readOnly }),
    /Connect the Fake account again to give Fake App access/
  )

  // Another member's account: any member can pick it
  const shared = await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'fake',
    accountId: 'account-3',
    scopes: ['rows.read', 'rows.write'],
    createdBy: 'user_2',
    tokens: {}
  })
  await save({ connectionId: shared })

  const integration = await ctx.integrationService.findOne('form_1', 'fakeapp')
  assert.strictEqual(integration.connectionId, shared)
  assert.strictEqual(integration.status, IntegrationStatusEnum.ACTIVE)
  assert.deepStrictEqual(ctx.resent, [integration.id])

  // Saving again keeps the account
  await save({ config: { sheet: 'Other' } })
  assert.strictEqual(ctx.integrations.get(integration.id).connectionId, shared)
}

async function testPickingAnAccountThatNeedsReconnecting() {
  const ctx = createAuth()
  const resolver = createSettingsResolver(ctx)
  const { connectionId, integrationId } = await connect(
    ctx,
    { accessToken: 'a', refreshToken: 'r' },
    { status: NEEDS_RECONNECT },
    { status: CONNECTION_NEEDS_RECONNECT }
  )
  const save = (connection?: string) =>
    resolver.updateIntegrationSettings(
      { formId: 'form_1', appId: 'fakeapp', config: { sheet: 'Other' }, connectionId: connection },
      FORM
    )

  await save()
  assert.strictEqual(
    ctx.integrations.get(integrationId).status,
    NEEDS_RECONNECT,
    'saving settings does not hide a revoked grant'
  )
  assert.deepStrictEqual(ctx.resent, [])

  const statusResolver = new UpdateIntegrationStatusResolver(ctx.integrationService)
  await assertBadRequest(
    statusResolver.updateIntegrationStatus({
      formId: 'form_1',
      appId: 'fakeapp',
      status: IntegrationStatusEnum.ACTIVE
    }),
    /Reconnect the account/
  )

  // Picking a working account fixes it, and sends what waited
  const working = await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'fake',
    accountId: 'account-2',
    scopes: ['rows.read', 'rows.write'],
    createdBy: 'user_1',
    tokens: {}
  })
  await save(working)
  assert.strictEqual(ctx.integrations.get(integrationId).status, IntegrationStatusEnum.ACTIVE)
  assert.strictEqual(ctx.integrations.get(integrationId).connectionId, working)
  assert.deepStrictEqual(ctx.resent, [integrationId])
  assert.ok(ctx.connections.has(connectionId), 'the other account stays connected')
}

function createUserService(users: Record<string, string>) {
  return {
    findAll: async (ids: string[]) =>
      ids.filter(id => users[id]).map(id => ({ id, name: users[id] }))
  }
}

async function testListsTheTeamsAccountsForAnApp() {
  const ctx = createAuth()
  const { connectionId } = await connect(ctx, { accessToken: 'a', refreshToken: 'r' })
  const readOnly = await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'fake',
    accountId: 'account-2',
    accountEmail: 'reader@example.com',
    scopes: ['rows.read'],
    createdBy: 'user_2',
    status: CONNECTION_NEEDS_RECONNECT,
    statusReason: 'Fake rejected the token request: invalid_grant',
    tokens: {}
  })
  // Another team's, and another provider's: not listed
  await ctx.connectionService.create({
    teamId: 'team_2',
    provider: 'fake',
    accountId: 'account-1',
    createdBy: 'user_9',
    tokens: {}
  })
  await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'unconfigured',
    accountId: 'account-1',
    createdBy: 'user_1',
    tokens: {}
  })

  const resolver = new IntegrationConnectionsResolver(
    ctx.appService,
    ctx.service,
    createUserService({ user_1: 'Ann', user_2: 'Ben' })
  )
  const listed = await resolver.integrationConnections({ formId: 'form_1', appId: 'fakeapp' }, FORM)

  assert.deepStrictEqual(listed, [
    {
      id: connectionId,
      provider: 'fake',
      providerName: 'Fake',
      accountEmail: 'owner@example.com',
      accountName: undefined,
      connectedBy: 'Ann',
      status: CONNECTION_ACTIVE,
      statusReason: undefined,
      hasScopes: true
    },
    {
      id: readOnly,
      provider: 'fake',
      providerName: 'Fake',
      accountEmail: 'reader@example.com',
      accountName: undefined,
      connectedBy: 'Ben',
      status: CONNECTION_NEEDS_RECONNECT,
      statusReason: 'Fake rejected the token request: invalid_grant',
      hasScopes: false
    }
  ])
  assert.ok(!JSON.stringify(listed).includes('tokens'))

  // Not for apps without OAuth2
  assert.deepStrictEqual(
    await resolver.integrationConnections({ formId: 'form_1', appId: 'keyapp' }, FORM),
    []
  )
}

// --- team settings ----------------------------------------------------------

function createTeamResolver(ctx: ReturnType<typeof createAuth>) {
  return new TeamIntegrationConnectionsResolver(
    ctx.appService,
    ctx.connectionService,
    ctx.integrationService,
    {
      findAllByIds: async (ids: string[]) =>
        [
          { id: 'form_1', name: 'Leads', teamId: 'team_1' },
          { id: 'form_2', name: 'Survey', teamId: 'team_1' }
        ].filter(form => ids.includes(form.id))
    },
    createUserService({ user_1: 'Ann', user_2: 'Ben' })
  )
}

async function testTeamSettingsListConnectedAccounts() {
  const ctx = createAuth()
  const { connectionId } = await connect(ctx, { accessToken: 'a', refreshToken: 'r' })
  await ctx.integrationService.create({
    formId: 'form_2',
    appId: 'fakeapp',
    config: {},
    status: IntegrationStatusEnum.ACTIVE,
    connectionId
  })
  const unused = await ctx.connectionService.create({
    teamId: 'team_1',
    provider: 'fake',
    accountId: 'account-2',
    accountEmail: 'ben@example.com',
    createdBy: 'user_2',
    tokens: {}
  })
  const team = { id: 'team_1', ownerId: 'user_owner' }
  const list = (userId: string) =>
    createTeamResolver(ctx).teamIntegrationConnections({ id: userId }, team, { teamId: 'team_1' })

  const forAnn = await list('user_1')
  assert.deepStrictEqual(
    forAnn.map((c: any) => [c.id, c.accountEmail, c.connectedBy, c.forms, c.canDisconnect]),
    [
      [
        connectionId,
        'owner@example.com',
        'Ann',
        [
          { id: 'form_1', name: 'Leads' },
          { id: 'form_2', name: 'Survey' }
        ],
        true
      ],
      [unused, 'ben@example.com', 'Ben', [], false]
    ]
  )
  assert.strictEqual(forAnn[0].providerName, 'Fake')
  assert.ok(!JSON.stringify(forAnn).includes('tokens'))

  // The owner can disconnect any of them; another member only their own
  assert.deepStrictEqual(
    (await list('user_owner')).map((c: any) => c.canDisconnect),
    [true, true]
  )
  assert.deepStrictEqual(
    (await list('user_2')).map((c: any) => c.canDisconnect),
    [false, true]
  )
}

// --- disconnecting ----------------------------------------------------------

const TEAM = { id: 'team_1', ownerId: 'user_owner' }

function captureLogs(ctx: ReturnType<typeof createAuth>) {
  const logged: string[] = []
  const log = (message: string) => logged.push(message)
  ;(ctx.service as any).logger = { info: log, warn: log, error: log }
  return logged
}

async function testDeletingAnIntegrationKeepsTheAccount() {
  const ctx = createAuth()
  const { connectionId } = await connect(ctx, { accessToken: 'a', refreshToken: 'r' })
  const otherForm = await ctx.integrationService.create({
    formId: 'form_2',
    appId: 'fakeapp',
    config: {},
    status: IntegrationStatusEnum.ACTIVE,
    connectionId
  })
  const deleted: string[] = []
  provider.requests = []

  await new DeleteIntegrationSettingsResolver({
    ...ctx.integrationService,
    delete: async (formId: string, appId: string) => {
      deleted.push(`${formId}/${appId}`)
      return true
    }
  }).deleteIntegrationSettings({ formId: 'form_1', appId: 'fakeapp' })

  assert.deepStrictEqual(deleted, ['form_1/fakeapp'])
  assert.ok(ctx.connections.has(connectionId), "the team's account stays connected")
  assert.deepStrictEqual(provider.revokeRequests, [])
  // Other forms keep using it
  assert.deepStrictEqual(
    [ctx.integrations.get(otherForm).status, ctx.integrations.get(otherForm).connectionId],
    [IntegrationStatusEnum.ACTIVE, connectionId]
  )
}

async function testDisconnectingRevokesAndHoldsIntegrations() {
  const ctx = createAuth()
  const { connectionId, integrationId } = await connect(ctx, {
    accessToken: 'a',
    refreshToken: 'r'
  })
  const disabled = await ctx.integrationService.create({
    formId: 'form_2',
    appId: 'fakeapp',
    config: {},
    status: IntegrationStatusEnum.DISABLED,
    connectionId
  })
  provider.requests = []
  provider.handler = () => ({ status: 200, body: {} })

  await ctx.service.disconnectConnection(ctx.connections.get(connectionId), 'user_1', TEAM)

  assert.strictEqual(ctx.connections.has(connectionId), false)
  assert.deepStrictEqual(
    provider.revokeRequests.map(r => r.params),
    [
      {
        token: 'r',
        token_type_hint: 'refresh_token',
        client_id: 'fake-client-id',
        client_secret: 'fake-client-secret'
      }
    ]
  )
  // Its integrations wait for another account, with their submissions held
  const active = ctx.integrations.get(integrationId)
  assert.strictEqual(active.status, NEEDS_RECONNECT)
  assert.strictEqual(active.connectionId, undefined)
  assert.strictEqual(ctx.integrations.get(disabled).status, IntegrationStatusEnum.DISABLED)
  assert.strictEqual(ctx.integrations.get(disabled).connectionId, undefined)
}

async function testOnlyTheConnectorOrOwnerCanDisconnect() {
  const ctx = createAuth()
  const { connectionId } = await connect(ctx, { accessToken: 'a', refreshToken: 'r' })
  provider.handler = () => ({ status: 200, body: {} })
  const resolver = new DisconnectIntegrationConnectionResolver(ctx.connectionService, ctx.service)
  const disconnect = (userId: string, input: Record<string, any> = {}, team = TEAM) =>
    resolver.disconnectIntegrationConnection({ id: userId }, team, {
      teamId: team.id,
      connectionId,
      ...input
    })

  await assert.rejects(disconnect('user_2'), (error: any) => error instanceof ForbiddenException)
  // Another team can't reach it
  await assertBadRequest(
    disconnect('user_1', {}, { id: 'team_2', ownerId: 'user_1' }),
    /does not exist/
  )
  await assertBadRequest(disconnect('user_1', { connectionId: 'missing' }), /does not exist/)
  assert.ok(ctx.connections.has(connectionId))

  // The team owner can
  assert.strictEqual(await disconnect('user_owner'), true)
  assert.strictEqual(ctx.connections.has(connectionId), false)

  // ...and so can whoever connected it
  const own = await connect(ctx, { accessToken: 'a', refreshToken: 'r' }, { formId: 'form_2' })
  await resolver.disconnectIntegrationConnection({ id: 'user_1' }, TEAM, {
    teamId: 'team_1',
    connectionId: own.connectionId
  })
  assert.strictEqual(ctx.connections.has(own.connectionId), false)
}

async function testRevokesAnAccessTokenWithoutRefreshToken() {
  const ctx = createAuth()
  const { connectionId } = await connect(ctx, { accessToken: 'a' })
  provider.requests = []
  provider.handler = () => ({ status: 200, body: {} })

  await ctx.service.disconnectConnection(ctx.connections.get(connectionId), 'user_1', TEAM)

  assert.deepStrictEqual(
    provider.revokeRequests.map(r => [r.params.token, r.params.token_type_hint]),
    [['a', 'access_token']]
  )
}

async function testFailedRevocationNeverBlocksDisconnecting() {
  // The provider refuses
  const refused = createAuth()
  const refusedLogs = captureLogs(refused)
  const first = await connect(refused, { accessToken: 'secret-a', refreshToken: 'secret-r' })
  provider.handler = () => ({ status: 503, body: { error: 'unavailable' } })

  await refused.service.disconnectConnection(
    refused.connections.get(first.connectionId),
    'user_1',
    TEAM
  )
  assert.strictEqual(refused.connections.has(first.connectionId), false)
  assert.match(
    refusedLogs.join('\n'),
    /didn't revoke the grant of connection connection_\d+: HTTP 503/
  )

  // The provider can't be reached
  const unreachable = createAuth()
  const unreachableLogs = captureLogs(unreachable)
  unreachable.appService.providers.fake.revokeUrl = 'http://127.0.0.1:1/revoke'
  const second = await connect(unreachable, { accessToken: 'secret-a', refreshToken: 'secret-r' })

  await unreachable.service.disconnectConnection(
    unreachable.connections.get(second.connectionId),
    'user_1',
    TEAM
  )
  assert.strictEqual(unreachable.connections.has(second.connectionId), false)
  assert.match(unreachableLogs.join('\n'), /failed: ECONNREFUSED/)

  for (const message of [...refusedLogs, ...unreachableLogs]) {
    assert.ok(!/secret-/.test(message), 'tokens stay out of logs')
  }
}

async function testNothingToRevokeStillDisconnects() {
  // No revoke endpoint
  const ctx = createAuth()
  delete ctx.appService.providers.fake.revokeUrl
  const first = await connect(ctx, { accessToken: 'a', refreshToken: 'r' })
  provider.requests = []

  await ctx.service.disconnectConnection(ctx.connections.get(first.connectionId), 'user_1', TEAM)
  assert.strictEqual(ctx.connections.has(first.connectionId), false)

  // Tokens that no longer decrypt
  const unreadable = createAuth()
  const second = await connect(unreadable, { accessToken: 'a', refreshToken: 'r' })
  unreadable.connections.get(second.connectionId).tokens.refreshToken = encryptSecret(
    'r',
    'old-key'
  )

  await unreadable.service.disconnectConnection(
    unreadable.connections.get(second.connectionId),
    'user_1',
    TEAM
  )
  assert.strictEqual(unreadable.connections.has(second.connectionId), false)
  assert.strictEqual(unreadable.integrations.get(second.integrationId).status, NEEDS_RECONNECT)
  assert.deepStrictEqual(provider.revokeRequests, [])
}

async function testAccountUsedByAnotherWorkspaceIsNotRevoked() {
  const ctx = createAuth()
  const logged = captureLogs(ctx)
  const { connectionId } = await connect(ctx, { accessToken: 'a', refreshToken: 'r' })
  // The same account, connected in another workspace: a provider that revokes
  // the whole grant would revoke that workspace's tokens too
  const elsewhere = await ctx.connectionService.create({
    teamId: 'team_2',
    provider: 'fake',
    accountId: 'account-1',
    createdBy: 'user_9',
    tokens: encryptTokens({ refreshToken: 'r2' })
  })
  // Another account in that workspace doesn't matter
  await ctx.connectionService.create({
    teamId: 'team_2',
    provider: 'fake',
    accountId: 'account-2',
    createdBy: 'user_9',
    tokens: {}
  })
  provider.requests = []
  provider.handler = () => ({ status: 200, body: {} })

  await ctx.service.disconnectConnection(ctx.connections.get(connectionId), 'user_1', TEAM)

  assert.strictEqual(ctx.connections.has(connectionId), false)
  assert.deepStrictEqual(provider.revokeRequests, [])
  assert.match(logged.join('\n'), /another workspace has the account connected/)

  // When that one goes too, the grant is revoked
  await ctx.service.disconnectConnection(ctx.connections.get(elsewhere), 'user_9', {
    id: 'team_2',
    ownerId: 'user_9'
  })
  assert.deepStrictEqual(
    provider.revokeRequests.map(r => r.params.token),
    ['r2']
  )
}

async function testConcurrentDisconnectsStillRevokeTheGrant() {
  const ctx = createAuth()
  const first = await connect(ctx, { accessToken: 'a1', refreshToken: 'r1' })
  const second = await connect(
    ctx,
    { accessToken: 'a2', refreshToken: 'r2' },
    { formId: 'form_2' },
    { teamId: 'team_2' }
  )
  provider.requests = []
  provider.handler = () => ({ status: 200, body: {} })

  await Promise.all([
    ctx.service.disconnectConnection(ctx.connections.get(first.connectionId), 'user_1', TEAM),
    ctx.service.disconnectConnection(ctx.connections.get(second.connectionId), 'user_1', {
      id: 'team_2',
      ownerId: 'user_1'
    })
  ])

  assert.strictEqual(ctx.connections.size, 0)
  // The last one to go revokes the grant
  assert.strictEqual(provider.revokeRequests.length, 1)
}

async function testTurningOnResendsWaitingSubmissions() {
  const ctx = createAuth()
  const { integrationId } = await connect(
    ctx,
    { accessToken: 'a', refreshToken: 'r' },
    { status: IntegrationStatusEnum.DISABLED }
  )
  const resolver = new UpdateIntegrationStatusResolver(ctx.integrationService)
  const setStatus = (status: number) =>
    resolver.updateIntegrationStatus({ formId: 'form_1', appId: 'fakeapp', status })

  await setStatus(IntegrationStatusEnum.DISABLED)
  assert.deepStrictEqual(ctx.resent, [])

  // e.g. turned off while it needed reconnecting, then reconnected
  await setStatus(IntegrationStatusEnum.ACTIVE)
  assert.deepStrictEqual(ctx.resent, [integrationId])
}

// --- refresh on use ---------------------------------------------------------

async function testValidTokenIsUsedWithoutRefresh() {
  const ctx = createAuth()
  const { integration } = await connect(ctx, {
    accessToken: 'access-valid',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() + 3600_000
  })
  provider.requests = []

  assert.deepStrictEqual(await ctx.service.getRunAuth(oauthApp, integration), {
    type: 'oauth2',
    accessToken: 'access-valid'
  })
  assert.strictEqual(provider.requests.length, 0)
  assert.deepStrictEqual(ctx.locks, [], 'no lock needed')
}

async function testExpiredTokenIsRefreshed() {
  const ctx = createAuth()
  // Expires within the safety margin, so it counts as expired
  const { connectionId, integration } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() + 30_000
  })
  provider.requests = []
  provider.handler = () => ({
    status: 200,
    body: { access_token: 'access-new', refresh_token: 'refresh-2', expires_in: 3600 }
  })

  assert.strictEqual(await ctx.service.getAccessToken(oauthApp, integration), 'access-new')
  assert.deepStrictEqual(
    provider.tokenRequests.map(r => r.params),
    [
      {
        grant_type: 'refresh_token',
        refresh_token: 'refresh-1',
        client_id: 'fake-client-id',
        client_secret: 'fake-client-secret'
      }
    ]
  )
  assert.deepStrictEqual(ctx.locks, [`integration_connection_refresh:${connectionId}`])

  const tokens = storedTokens(ctx, connectionId)
  assert.strictEqual(tokens.accessToken, 'access-new')
  assert.strictEqual(tokens.refreshToken, 'refresh-2', 'a rotated refresh token is kept')
  assert.ok(tokens.expiresAt > Date.now() + 3500_000)
  assert.strictEqual(ctx.connections.get(connectionId).tokenVersion, 1)

  // The refreshed token is reused until it expires
  provider.requests = []
  assert.strictEqual(await ctx.service.getAccessToken(oauthApp, integration), 'access-new')
  assert.strictEqual(provider.requests.length, 0)
}

async function testRefreshMovesTokensToTheCurrentKey() {
  const ctx = createAuth()
  // Connected before the key was rotated
  const { connectionId, integration } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000
  })
  ctx.appService.secrets = new IntegrationSecrets(
    'rotated-key',
    process.env.INTEGRATION_ENCRYPTION_KEY
  )
  provider.handler = () => ({ status: 200, body: { access_token: 'access-new', expires_in: 3600 } })

  assert.strictEqual(await ctx.service.getAccessToken(oauthApp, integration), 'access-new')

  const tokens = ctx.connections.get(connectionId).tokens
  const rotatedId = secretKeyId('rotated-key')
  assert.ok(tokens.accessToken.startsWith(`${rotatedId}:`))
  // The kept refresh token is re-encrypted too
  assert.ok(tokens.refreshToken.startsWith(`${rotatedId}:`))
  assert.strictEqual(
    new IntegrationSecrets('rotated-key').decrypt(tokens.refreshToken),
    'refresh-1'
  )
}

async function testOneRefreshServesEveryIntegration() {
  const ctx = createAuth()
  const { connectionId, integration } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000
  })
  const otherForm = await ctx.integrationService.create({
    formId: 'form_2',
    appId: 'fakeapp',
    config: {},
    status: IntegrationStatusEnum.ACTIVE,
    connectionId
  })
  provider.requests = []
  // A provider that rotates refresh tokens: a second refresh with the old
  // one would be rejected
  provider.handler = params =>
    params.refresh_token === 'refresh-1' && provider.tokenRequests.length === 1
      ? {
          status: 200,
          body: { access_token: 'access-new', refresh_token: 'refresh-2', expires_in: 3600 }
        }
      : { status: 400, body: { error: 'invalid_grant' } }

  // Jobs of two forms find the token expired at the same moment
  const tokens = await Promise.all([
    ctx.service.getAccessToken(oauthApp, integration),
    ctx.service.getAccessToken(oauthApp, ctx.integrations.get(otherForm)),
    ctx.service.getAccessToken(oauthApp, integration)
  ])

  assert.deepStrictEqual(tokens, ['access-new', 'access-new', 'access-new'])
  assert.strictEqual(provider.tokenRequests.length, 1, 'refreshed once')
  assert.strictEqual(ctx.connections.get(connectionId).status, CONNECTION_ACTIVE)
}

async function testRevokedGrantMarksTheConnection() {
  const ctx = createAuth()
  const { connectionId, integrationId, integration } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-revoked',
    expiresAt: Date.now() - 1000
  })
  const otherForm = await ctx.integrationService.create({
    formId: 'form_2',
    appId: 'fakeapp',
    config: {},
    status: IntegrationStatusEnum.ACTIVE,
    connectionId
  })
  const disabled = await ctx.integrationService.create({
    formId: 'form_3',
    appId: 'fakeapp',
    config: {},
    status: IntegrationStatusEnum.DISABLED,
    connectionId
  })
  provider.handler = () => ({
    status: 400,
    body: { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }
  })

  await assert.rejects(ctx.service.getAccessToken(oauthApp, integration), (error: any) => {
    assert.ok(error instanceof IntegrationAuthError)
    assert.strictEqual(error.needsReconnect, true)
    assert.match(error.message, /invalid_grant/)
    assert.ok(!error.message.includes('refresh-revoked'), 'tokens stay out of messages')
    return true
  })

  const connection = ctx.connections.get(connectionId)
  assert.strictEqual(connection.status, CONNECTION_NEEDS_RECONNECT)
  assert.match(connection.statusReason, /invalid_grant/)
  // Every active integration using it waits, not only this job's
  assert.deepStrictEqual(
    [integrationId, otherForm, disabled].map(id => ctx.integrations.get(id).status),
    [NEEDS_RECONNECT, NEEDS_RECONNECT, IntegrationStatusEnum.DISABLED]
  )

  // Later jobs fail without calling the provider
  provider.requests = []
  await assert.rejects(
    ctx.service.getAccessToken(oauthApp, ctx.integrations.get(otherForm)),
    (error: any) => error instanceof IntegrationAuthError && /invalid_grant/.test(error.message)
  )
  assert.strictEqual(provider.requests.length, 0)

  // ...even if the access token hasn't expired yet: the grant behind it is gone
  const fresh = await connect(
    ctx,
    { accessToken: 'still-unexpired', refreshToken: 'r', expiresAt: Date.now() + 3600_000 },
    { formId: 'form_4' },
    { accountId: 'account-4', status: CONNECTION_NEEDS_RECONNECT, statusReason: 'revoked' }
  )
  await assert.rejects(
    ctx.service.getAccessToken(oauthApp, fresh.integration),
    (error: any) => error instanceof IntegrationAuthError && error.needsReconnect
  )
  assert.strictEqual(ctx.integrations.get(fresh.integrationId).status, NEEDS_RECONNECT)
}

async function testReconnectDuringRefreshIsNotARevocation() {
  const ctx = createAuth()
  const { connectionId, integrationId, integration } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000
  })

  // Someone connects the account again while the refresh runs, and the
  // provider rejects the old refresh token
  provider.handler = () => {
    const connection = ctx.connections.get(connectionId)
    connection.tokens = encryptTokens({
      accessToken: 'access-reconnected',
      refreshToken: 'refresh-2',
      expiresAt: Date.now() + 3600_000
    })
    connection.tokenVersion++
    return { status: 400, body: { error: 'invalid_grant' } }
  }

  assert.strictEqual(await ctx.service.getAccessToken(oauthApp, integration), 'access-reconnected')
  assert.strictEqual(ctx.connections.get(connectionId).status, CONNECTION_ACTIVE)
  assert.strictEqual(ctx.integrations.get(integrationId).status, IntegrationStatusEnum.ACTIVE)
}

async function testRefreshDoesNotOverwriteAReconnect() {
  const ctx = createAuth()
  const { connectionId, integration } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000
  })

  // The account is connected again while the refresh runs, which succeeds
  provider.handler = () => {
    const connection = ctx.connections.get(connectionId)
    connection.tokens = encryptTokens({
      accessToken: 'access-reconnected',
      refreshToken: 'refresh-9'
    })
    connection.tokenVersion++
    return { status: 200, body: { access_token: 'access-refreshed', expires_in: 3600 } }
  }

  // This job can use its token, but the reconnect's tokens are kept
  assert.strictEqual(await ctx.service.getAccessToken(oauthApp, integration), 'access-refreshed')
  assert.deepStrictEqual(
    [storedTokens(ctx, connectionId).accessToken, storedTokens(ctx, connectionId).refreshToken],
    ['access-reconnected', 'refresh-9']
  )
}

async function testTransientRefreshFailureIsRetried() {
  const ctx = createAuth()
  const { connectionId, integrationId, integration } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000
  })
  provider.handler = () => ({ status: 503, body: 'unavailable' })

  await assert.rejects(ctx.service.getAccessToken(oauthApp, integration), (error: any) => {
    assert.ok(error instanceof OAuth2TokenError, 'not an IntegrationAuthError, so Bull retries')
    assert.match(error.message, /HTTP 503/)
    return true
  })
  assert.strictEqual(ctx.connections.get(connectionId).status, CONNECTION_ACTIVE)
  assert.strictEqual(ctx.integrations.get(integrationId).status, IntegrationStatusEnum.ACTIVE)

  // A provider that can't be reached at all
  const unreachable = createAuth()
  unreachable.appService.providers.fake.tokenUrl = 'http://127.0.0.1:1/token'
  const connected = await connect(unreachable, { refreshToken: 'refresh-1', expiresAt: 1 })
  await assert.rejects(
    unreachable.service.getAccessToken(oauthApp, connected.integration),
    (error: any) => error instanceof OAuth2TokenError && /ECONNREFUSED/.test(error.message)
  )
}

async function testMissingOrUnreadableConnectionNeedsReconnect() {
  const ctx = createAuth()

  // No account picked (e.g. it was disconnected)
  const missing = await ctx.integrationService.create({
    formId: 'form_2',
    appId: 'fakeapp',
    status: IntegrationStatusEnum.ACTIVE
  })
  await assert.rejects(
    ctx.service.getAccessToken(oauthApp, ctx.integrations.get(missing)),
    (error: any) => error instanceof IntegrationAuthError && error.needsReconnect
  )
  assert.strictEqual(ctx.integrations.get(missing).status, NEEDS_RECONNECT)

  // Tokens encrypted with a key that has since changed
  const { connectionId, integrationId, integration } = await connect(ctx, {
    accessToken: 'a',
    refreshToken: 'r'
  })
  ctx.connections.get(connectionId).tokens.accessToken = encryptSecret('a', 'old-key')
  await assert.rejects(
    ctx.service.getAccessToken(oauthApp, integration),
    (error: any) =>
      error instanceof IntegrationAuthError &&
      error.needsReconnect &&
      /tokens can't be decrypted with INTEGRATION_ENCRYPTION_KEY or INTEGRATION_ENCRYPTION_KEY_PREVIOUS/.test(
        error.message
      )
  )
  assert.strictEqual(ctx.connections.get(connectionId).status, CONNECTION_NEEDS_RECONNECT)
  assert.strictEqual(ctx.integrations.get(integrationId).status, NEEDS_RECONNECT)
}

// --- queue ------------------------------------------------------------------

function createQueue(ctx: ReturnType<typeof createAuth>, runs: any[]) {
  const app = { ...oauthApp, run: async (input: any) => runs.push(input) }
  const appService = createAppService([app])

  return new IntegrationQueue(
    appService,
    ctx.integrationService,
    new IntegrationAuthService(
      appService,
      ctx.integrationService,
      ctx.connectionService,
      ctx.redisService
    ),
    { findById: async () => ({ id: 'submission_1' }) },
    { findById: async () => ({ id: 'form_1' }) }
  )
}

function createJob(integrationId: string) {
  const job = {
    discarded: false,
    data: {
      appId: 'fakeapp',
      formId: 'form_1',
      integrationId,
      submissionId: 'submission_1'
    },
    discard: async () => {
      job.discarded = true
    }
  }

  return job
}

async function testJobRefreshesAndPassesAuthToRun() {
  const ctx = createAuth()
  const runs: any[] = []
  const { integrationId } = await connect(ctx, {
    accessToken: 'access-old',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() - 1000
  })
  provider.handler = () => ({ status: 200, body: { access_token: 'access-fresh', expires_in: 60 } })

  const job = createJob(integrationId)
  await createQueue(ctx, runs).process(job)

  assert.strictEqual(runs.length, 1)
  assert.deepStrictEqual(runs[0].auth, { type: 'oauth2', accessToken: 'access-fresh' })
  assert.deepStrictEqual(runs[0].config, { sheet: 'Leads' })
  assert.strictEqual(job.discarded, false)
}

async function testJobStopsRetryingWhenReconnectIsNeeded() {
  const ctx = createAuth()
  const runs: any[] = []
  const { integrationId } = await connect(ctx, {
    refreshToken: 'refresh-revoked',
    expiresAt: Date.now() - 1000
  })
  provider.handler = () => ({ status: 400, body: { error: 'invalid_grant' } })

  const job = createJob(integrationId)
  await assert.rejects(createQueue(ctx, runs).process(job), IntegrationAuthError)
  assert.strictEqual(job.discarded, true, 'no further attempts')
  assert.strictEqual(runs.length, 0)
  assert.strictEqual(ctx.integrations.get(integrationId).status, NEEDS_RECONNECT)
  assert.deepStrictEqual(
    ctx.held.map(input => [input.submissionId, input.attempt]),
    [['submission_1', 1]],
    'kept for the reconnect'
  )

  // Jobs already queued fail straight away, without calling the provider
  provider.requests = []
  const queued = createJob(integrationId)
  await assert.rejects(createQueue(ctx, runs).process(queued), /needs reconnecting/)
  assert.strictEqual(queued.discarded, true)
  assert.strictEqual(provider.requests.length, 0)
}

async function testJobRetriesTransientRefreshFailures() {
  const ctx = createAuth()
  const { integrationId } = await connect(ctx, { refreshToken: 'r', expiresAt: 1 })
  provider.handler = () => ({ status: 500, body: {} })

  const job = createJob(integrationId)
  await assert.rejects(createQueue(ctx, []).process(job), OAuth2TokenError)
  assert.strictEqual(job.discarded, false, 'Bull may try again')
}

// --- tokens the app's service rejects ---------------------------------------

// Throws like an app whose service answered 401 to any token but `valid`
function rejectUnless(valid: string, calls: string[]) {
  return async (auth: any) => {
    calls.push(auth.accessToken)

    if (auth.accessToken !== valid) {
      throw AppError.fromStatus(401, 'Fake rejected the access token')
    }

    return 'ok'
  }
}

async function testRejectedTokenIsRefreshedOnce() {
  const ctx = createAuth()
  const { connectionId, integration } = await connect(ctx, {
    accessToken: 'access-revoked-early',
    refreshToken: 'refresh-1',
    expiresAt: Date.now() + 3600_000
  })
  provider.requests = []
  provider.handler = () => ({ status: 200, body: { access_token: 'access-new', expires_in: 3600 } })
  const calls: string[] = []

  assert.strictEqual(
    await ctx.service.withRunAuth(oauthApp, integration, rejectUnless('access-new', calls)),
    'ok'
  )
  assert.deepStrictEqual(calls, ['access-revoked-early', 'access-new'])
  assert.strictEqual(provider.tokenRequests.length, 1, 'refreshed although it had not expired')
  assert.strictEqual(storedTokens(ctx, connectionId).accessToken, 'access-new')

  // Rejected again after a refresh: passed on, not refreshed in a loop
  const again: string[] = []
  await assert.rejects(
    ctx.service.withRunAuth(
      oauthApp,
      ctx.integrations.get(integration.id),
      rejectUnless('x', again)
    ),
    (error: any) => error instanceof AppError && error.unauthorized
  )
  assert.strictEqual(again.length, 2)

  // Another job already refreshed the rejected token: its token is used
  const shared = await connect(
    ctx,
    { accessToken: 'access-stale', refreshToken: 'r', expiresAt: Date.now() + 3600_000 },
    { formId: 'form_5' },
    { accountId: 'account-5' }
  )
  // As this job read it, before the other job's refresh
  const stale = { ...shared.connection, tokens: { ...shared.connection.tokens } }
  ctx.connections.get(shared.connectionId).tokens = encryptTokens({
    accessToken: 'access-from-other-job',
    refreshToken: 'r',
    expiresAt: Date.now() + 3600_000
  })
  provider.requests = []
  const reused: string[] = []
  await ctx.service.withAccessToken(
    ctx.appService.findOAuth2Provider(oauthApp),
    stale,
    rejectUnless('access-from-other-job', reused)
  )
  assert.deepStrictEqual(reused, ['access-stale', 'access-from-other-job'])
  assert.strictEqual(provider.tokenRequests.length, 0)
}

async function testRejectedTokenWithRevokedGrantWaitsForReconnect() {
  const ctx = createAuth()
  const { connectionId, integrationId } = await connect(ctx, {
    accessToken: 'access-revoked-early',
    refreshToken: 'refresh-revoked',
    expiresAt: Date.now() + 3600_000
  })
  provider.handler = () => ({ status: 400, body: { error: 'invalid_grant' } })
  const app = { ...oauthApp, run: rejectUnless('never', []) }
  const appService = createAppService([app])
  const queue = new IntegrationQueue(
    appService,
    ctx.integrationService,
    new IntegrationAuthService(
      appService,
      ctx.integrationService,
      ctx.connectionService,
      ctx.redisService
    ),
    { findById: async () => ({ id: 'submission_1' }) },
    { findById: async () => ({ id: 'form_1' }) }
  )
  const job = createJob(integrationId)

  await assert.rejects(queue.process(job), (error: any) => error instanceof IntegrationAuthError)
  assert.strictEqual(ctx.connections.get(connectionId).status, CONNECTION_NEEDS_RECONNECT)
  assert.strictEqual(ctx.integrations.get(integrationId).status, NEEDS_RECONNECT)
  assert.deepStrictEqual(
    ctx.held.map(input => input.submissionId),
    ['submission_1']
  )
  assert.strictEqual(job.discarded, true)
}

// --- settings that use the account -------------------------------------------

const loaderApp: AppDefinition = defineApp({
  ...oauthApp,
  id: 'loaderapp',
  settings: [
    { type: 'text', name: 'sheet', label: 'Sheet', required: true },
    {
      type: 'select',
      name: 'tab',
      label: 'Tab',
      dependsOn: ['sheet'],
      loadOptions: async ({ auth, config }: any) => {
        if (auth.accessToken !== 'access-good') {
          throw AppError.fromStatus(401, 'Fake rejected the access token')
        }
        return [{ label: `${config.sheet} tab`, value: 't1' }]
      }
    }
  ],
  validate: async (config: any, { auth, form }: any) => {
    if (auth.accessToken !== 'access-good') {
      throw AppError.fromStatus(401, 'Fake rejected the access token')
    }
    return { ...config, tab: config.tab ?? 't1', checkedFor: form.id }
  }
})

function createLoaderCtx() {
  const ctx = createAuth()
  ctx.appService = createAppService([loaderApp])
  ctx.service = new IntegrationAuthService(
    ctx.appService,
    ctx.integrationService,
    ctx.connectionService,
    ctx.redisService
  )
  return ctx
}

async function testLoaderGetsAFreshTokenAndTheFormValues() {
  const ctx = createLoaderCtx()
  const { connectionId } = await connect(
    ctx,
    { accessToken: 'access-expired', refreshToken: 'refresh-1', expiresAt: Date.now() - 1000 },
    { appId: 'loaderapp' }
  )
  provider.handler = () => ({
    status: 200,
    body: { access_token: 'access-good', expires_in: 3600 }
  })
  const resolver = new IntegrationSettingOptionsResolver(
    ctx.appService,
    ctx.integrationService,
    ctx.service
  )
  const load = (input: Record<string, any> = {}) =>
    resolver.integrationSettingOptions(
      {
        formId: 'form_1',
        appId: 'loaderapp',
        setting: 'tab',
        config: { sheet: 'Leads' },
        ...input
      },
      FORM
    )

  assert.deepStrictEqual(await load(), [{ label: 'Leads tab', value: 't1' }])
  assert.strictEqual(storedTokens(ctx, connectionId).accessToken, 'access-good')

  // Only the team's accounts
  const otherTeam = await ctx.connectionService.create({
    teamId: 'team_2',
    provider: 'fake',
    accountId: 'account-9',
    scopes: ['rows.read', 'rows.write'],
    createdBy: 'user_9',
    tokens: {}
  })
  await assertBadRequest(load({ connectionId: otherTeam }), /Connect your Fake account first/)
  await assertBadRequest(load({ setting: 'sheet' }), /no options to load for sheet/)
}

async function testLoaderAuthErrorMarksTheConnection() {
  const ctx = createLoaderCtx()
  const { connectionId, integrationId } = await connect(
    ctx,
    // Unexpired, but access was revoked: the service rejects it
    {
      accessToken: 'access-revoked-early',
      refreshToken: 'refresh-revoked',
      expiresAt: Date.now() + 3600_000
    },
    { appId: 'loaderapp' }
  )
  provider.handler = () => ({ status: 400, body: { error: 'invalid_grant' } })
  const resolver = new IntegrationSettingOptionsResolver(
    ctx.appService,
    ctx.integrationService,
    ctx.service
  )
  const load = () =>
    resolver.integrationSettingOptions(
      { formId: 'form_1', appId: 'loaderapp', setting: 'tab', config: { sheet: 'Leads' } },
      FORM
    )

  await assertBadRequest(load(), /invalid_grant.*Reconnect the account/)
  assert.strictEqual(ctx.connections.get(connectionId).status, CONNECTION_NEEDS_RECONNECT)
  assert.strictEqual(ctx.integrations.get(integrationId).status, NEEDS_RECONNECT)

  // Then it asks for a reconnect without calling the provider
  provider.requests = []
  await assertBadRequest(load(), /Reconnect the Fake account or pick another one first/)
  assert.strictEqual(provider.requests.length, 0)
}

async function testSavingValidatesWithThePickedAccount() {
  const ctx = createLoaderCtx()
  const { connectionId, integrationId } = await connect(
    ctx,
    { accessToken: 'access-good', refreshToken: 'refresh-1', expiresAt: Date.now() + 3600_000 },
    { appId: 'loaderapp', config: {} }
  )
  const resolver = new UpdateIntegrationSettingsResolver(
    ctx.appService,
    ctx.integrationService,
    ctx.service
  )
  const save = () =>
    resolver.updateIntegrationSettings(
      { formId: 'form_1', appId: 'loaderapp', config: { sheet: 'Leads' }, connectionId },
      FORM
    )

  await save()
  // The config validate returned is the one stored
  assert.deepStrictEqual(ctx.integrations.get(integrationId).config, {
    sheet: 'Leads',
    tab: 't1',
    checkedFor: 'form_1'
  })

  ctx.connections.get(connectionId).status = CONNECTION_NEEDS_RECONNECT
  await assertBadRequest(save(), /Reconnect the Fake account or pick another one first/)
}

async function testAppsListDescribesLoadedAndConditionalSettings() {
  const app = defineApp({
    ...loaderApp,
    id: 'described',
    settings: [
      { type: 'switch', name: 'createNew', label: 'Create new' },
      ...loaderApp.settings.map((setting: any) => ({
        ...setting,
        visibleWhen: { createNew: false }
      }))
    ]
  })
  const [listed] = await new AppsResolver(createAppService([app])).apps()

  assert.deepStrictEqual(
    listed.settings.map((setting: any) => [
      setting.name,
      setting.loadsOptions,
      setting.dependsOn,
      setting.visibleWhen
    ]),
    [
      ['createNew', false, undefined, undefined],
      ['sheet', false, undefined, { createNew: false }],
      ['tab', true, ['sheet'], { createNew: false }]
    ]
  )
}

// --- callback controller ----------------------------------------------------

const SESSION = { id: 'user_1', deviceId: 'device_1' }

// Sessions are read from `req.session` here; `live` lists the user:device
// pairs whose login hasn't expired
function createAuthService(live = new Set(['user_1:device_1', 'user_2:device_1'])) {
  return {
    getSession: (req: any) => req.session,
    isExpired: async (userId: string, deviceId: string) => !live.has(`${userId}:${deviceId}`)
  }
}

function createController(ctx: ReturnType<typeof createAuth>) {
  return new IntegrationOAuthController(ctx.appService, createAuthService(), ctx.service)
}

function createCallbackController(
  ctx: ReturnType<typeof createAuth>,
  members = true,
  authService = createAuthService()
) {
  return new IntegrationOAuthCallbackController(
    ctx.appService,
    authService,
    {
      findById: async (id: string) =>
        id === 'form_1' ? { id: 'form_1', teamId: 'team_1', projectId: 'project_1' } : null
    },
    { findMemberById: async () => (members ? { id: 'member' } : null) },
    { findMemberById: async () => (members ? { id: 'member' } : null) },
    ctx.service
  )
}

// The provider's redirect back: a cross-site navigation, so the browser sends
// the SameSite=None session and the Lax state cookie, but not the webapp's
// SameSite=Strict device-id cookie
function callbackRequest(state: string, session: any = SESSION) {
  return { cookies: { HEYFORM_INTEGRATION_OAUTH_STATE: state }, session }
}

function createResponse() {
  const res = {
    cookies: {} as Record<string, any>,
    cleared: [] as string[],
    redirectedTo: undefined as string | undefined,
    cookie(name: string, value: string, options: any) {
      res.cookies[name] = { value, options }
    },
    clearCookie(name: string) {
      res.cleared.push(name)
    },
    redirect(_status: number, url: string) {
      res.redirectedTo = url
    }
  }

  return res
}

async function startAuthorization(ctx: ReturnType<typeof createAuth>) {
  const res = createResponse()
  await createController(ctx).authorize('form_1', 'fakeapp', { id: 'user_1' }, res, {
    session: SESSION
  })

  const cookie = res.cookies.HEYFORM_INTEGRATION_OAUTH_STATE
  assert.strictEqual(cookie.options.httpOnly, true)
  assert.strictEqual(cookie.options.path, '/api/integrations/oauth')

  const state = new URL(res.redirectedTo!).searchParams.get('state')!
  assert.strictEqual(cookie.value, state)

  return state
}

async function testCallbackConnectsAndRedirectsBack() {
  const ctx = createAuth()
  const state = await startAuthorization(ctx)
  grantTokens()

  const res = createResponse()
  await createCallbackController(ctx).callback(
    { state, code: 'code-1' },
    callbackRequest(state),
    res
  )

  assert.strictEqual(
    res.redirectedTo,
    '/workspace/team_1/project/project_1/form/form_1/integrations?appId=fakeapp&integrationConnected=1'
  )
  assert.deepStrictEqual(res.cleared, ['HEYFORM_INTEGRATION_OAUTH_STATE'])

  // A connection of the form's team, by this user, picked for the form
  const [connection] = ctx.connections.values()
  assert.deepStrictEqual([connection.teamId, connection.createdBy], ['team_1', 'user_1'])
  assert.strictEqual([...ctx.integrations.values()][0].connectionId, connection.id)
}

async function testCallbackNeedsTheSameLiveSession() {
  const ctx = createAuth()
  const state = await startAuthorization(ctx)
  const controller = createCallbackController(ctx)

  // Logged out, or no session cookie
  await assert.rejects(
    controller.callback({ state, code: 'c' }, callbackRequest(state, null), createResponse()),
    /Unauthorized/
  )
  // A session whose login has expired or was revoked
  await assert.rejects(
    createCallbackController(ctx, true, createAuthService(new Set())).callback(
      { state, code: 'c' },
      callbackRequest(state),
      createResponse()
    ),
    /Unauthorized/
  )
  // Neither attempt used up the state, so the real callback still works
  grantTokens()
  const res = createResponse()
  await controller.callback({ state, code: 'c' }, callbackRequest(state), res)
  assert.match(res.redirectedTo!, /integrationConnected=1$/)
}

async function testCallbackRejectsForeignOrForgedState() {
  const ctx = createAuth()
  const state = await startAuthorization(ctx)
  const controller = createCallbackController(ctx)

  // No cookie, e.g. a link opened in another browser
  await assertBadRequest(
    controller.callback({ state, code: 'c' }, { cookies: {}, session: SESSION }, createResponse()),
    /Invalid OAuth state/
  )
  // Cookie doesn't match
  await assertBadRequest(
    controller.callback(
      { state, code: 'c' },
      callbackRequest('x'.repeat(state.length)),
      createResponse()
    ),
    /Invalid OAuth state/
  )
  // Another logged-in user
  await assertBadRequest(
    controller.callback(
      { state, code: 'c' },
      callbackRequest(state, { id: 'user_2', deviceId: 'device_1' }),
      createResponse()
    ),
    /Invalid OAuth state/
  )
  assert.strictEqual(ctx.integrations.size, 0)

  // The same user, but a session from another device
  const otherDevice = await startAuthorization(ctx)
  await assertBadRequest(
    createCallbackController(
      ctx,
      true,
      createAuthService(new Set(['user_1:device_1', 'user_1:device_2']))
    ).callback(
      { state: otherDevice, code: 'c' },
      callbackRequest(otherDevice, { id: 'user_1', deviceId: 'device_2' }),
      createResponse()
    ),
    /Invalid OAuth state/
  )
  assert.strictEqual(ctx.integrations.size, 0)

  // Lost access to the form while at the provider
  const second = await startAuthorization(ctx)
  await assertBadRequest(
    createCallbackController(ctx, false).callback(
      { state: second, code: 'c' },
      callbackRequest(second),
      createResponse()
    ),
    /permission/
  )
  assert.strictEqual(ctx.integrations.size, 0)
  assert.strictEqual(ctx.connections.size, 0)
}

async function testCallbackReportsDeniedAndFailedConnections() {
  const ctx = createAuth()
  const denied = await startAuthorization(ctx)
  const res = createResponse()

  await createCallbackController(ctx).callback(
    { state: denied, error: 'access_denied' },
    callbackRequest(denied),
    res
  )
  assert.match(res.redirectedTo!, /\?appId=fakeapp&integrationError=access_denied$/)

  const failed = await startAuthorization(ctx)
  const failedRes = createResponse()
  provider.handler = () => ({ status: 400, body: { error: 'invalid_grant' } })

  await createCallbackController(ctx).callback(
    { state: failed, code: 'expired-code' },
    callbackRequest(failed),
    failedRes
  )
  assert.match(failedRes.redirectedTo!, /integrationError=connect_failed$/)
  assert.strictEqual(ctx.integrations.size, 0)
  assert.strictEqual(ctx.connections.size, 0)
}

async function run() {
  await provider.start()

  try {
    testDefineAppValidatesAuthAndQueue()
    testEncryptSecret()
    testAppJobOptions()
    await testAddQueueAppliesAppOptions()
    await testHidesAppsWithoutProviderCredentials()
    await testApiKeyIsStoredEncryptedAndNeverReturned()
    testMaskApiKey()
    await testMissingApiKeyFailsWithoutRetry()
    await testUnreadableApiKeyNeedsANewKey()
    await testAuthorizeUrlAndState()
    await testStateIsBoundToUserAndSingleUse()
    await testConnectingCreatesATeamConnection()
    await testRejectsConnectionsThatCantBeUsed()
    await testSameAccountSharesOneConnection()
    await testReconnectingResumesEveryIntegrationUsingIt()
    await testSettingsPickOneOfTheTeamsAccounts()
    await testPickingAnAccountThatNeedsReconnecting()
    await testListsTheTeamsAccountsForAnApp()
    await testTeamSettingsListConnectedAccounts()
    await testDeletingAnIntegrationKeepsTheAccount()
    await testDisconnectingRevokesAndHoldsIntegrations()
    await testOnlyTheConnectorOrOwnerCanDisconnect()
    await testRevokesAnAccessTokenWithoutRefreshToken()
    await testFailedRevocationNeverBlocksDisconnecting()
    await testNothingToRevokeStillDisconnects()
    await testAccountUsedByAnotherWorkspaceIsNotRevoked()
    await testConcurrentDisconnectsStillRevokeTheGrant()
    await testTurningOnResendsWaitingSubmissions()
    await testValidTokenIsUsedWithoutRefresh()
    await testExpiredTokenIsRefreshed()
    await testRefreshMovesTokensToTheCurrentKey()
    await testOneRefreshServesEveryIntegration()
    await testRevokedGrantMarksTheConnection()
    await testReconnectDuringRefreshIsNotARevocation()
    await testRefreshDoesNotOverwriteAReconnect()
    await testTransientRefreshFailureIsRetried()
    await testMissingOrUnreadableConnectionNeedsReconnect()
    await testJobRefreshesAndPassesAuthToRun()
    await testJobStopsRetryingWhenReconnectIsNeeded()
    await testJobRetriesTransientRefreshFailures()
    await testRejectedTokenIsRefreshedOnce()
    await testRejectedTokenWithRevokedGrantWaitsForReconnect()
    await testLoaderGetsAFreshTokenAndTheFormValues()
    await testLoaderAuthErrorMarksTheConnection()
    await testSavingValidatesWithThePickedAccount()
    await testAppsListDescribesLoadedAndConditionalSettings()
    await testCallbackConnectsAndRedirectsBack()
    await testCallbackNeedsTheSameLiveSession()
    await testCallbackRejectsForeignOrForgedState()
    await testCallbackReportsDeniedAndFailedConnections()
  } finally {
    await provider.stop()
  }
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
