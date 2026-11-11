import assert from 'assert'

const Module = require('module')
const originalLoad = Module._load

const SocialLoginTypeEnum = {
  APPLE: 'apple',
  GOOGLE: 'google',
  GOOGLE_ONE_TAP: 'google-one-tap'
}

let environment = {
  APP_DISABLE_REGISTRATION: false,
  DISABLE_LOGIN_WITH_OIDC: false,
  OIDC_ALLOW_PROVISIONING: false,
  OIDC_SYNC_NAME: false
}

class TestBadRequestException extends Error {}

Module._load = function (request: string, parent: any, isMain: boolean) {
  if (request === '@heyform-inc/shared-types-enums') {
    return { SocialLoginTypeEnum }
  }
  if (request === '@nestjs/common') {
    return {
      BadRequestException: TestBadRequestException,
      Injectable: () => (target: unknown) => target
    }
  }
  if (request === '@nestjs/mongoose') {
    return { InjectModel: () => () => undefined }
  }
  if (request === '@heyform-inc/utils') {
    return {
      helper: {
        isEmpty: (value: unknown) =>
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0),
        isValid: (value: unknown) =>
          value !== undefined &&
          value !== null &&
          value !== '' &&
          !(typeof value === 'object' && Object.keys(value as object).length === 0)
      }
    }
  }
  if (request === '@environments') {
    return {
      APPLE_LOGIN_KEY_ID: '',
      APPLE_LOGIN_PRIVATE_KEY_PATH: '',
      APPLE_LOGIN_TEAM_ID: '',
      APPLE_LOGIN_WEB_CLIENT_ID: '',
      APP_HOMEPAGE_URL: 'https://forms.example.com',
      GOOGLE_LOGIN_CLIENT_ID: '',
      GOOGLE_LOGIN_CLIENT_SECRET: '',
      OIDC_CLIENT_ID: 'heyform',
      OIDC_CLIENT_SECRET: 'client_secret',
      OIDC_ISSUER: 'https://identity.example.com',
      ...environment
    }
  }
  if (request === '@model') {
    return { UserSocialAccountModel: { name: 'UserSocialAccountModel' } }
  }
  if (request === '@utils') {
    return {
      OIDC_LOGIN_KIND: 'oidc',
      OidcSocialLogin: class {},
      appleLoginUrl: () => '',
      appleUserInfo: async () => undefined,
      googleLoginUrl: () => '',
      googleUserInfo: async () => undefined,
      isDuplicateEmailError: (error: any) => error?.code === 11000 && error?.keyPattern?.email
    }
  }
  if (request === './user.service' && parent?.filename?.endsWith('social-login.service.ts')) {
    return { UserService: class {} }
  }
  if (request === 'mongoose') {
    return {}
  }

  return originalLoad.call(this, request, parent, isMain)
}

interface HarnessOptions {
  appDisableRegistration?: boolean
  disableLoginWithOidc?: boolean
  oidcAllowProvisioning?: boolean
  oidcSyncName?: boolean
  existingSocialUserId?: string
  existingUser?: Record<string, unknown> | null
  users?: Array<Record<string, any>>
  // A user that another request creates with the same email between the check and the create
  racingUser?: Record<string, any>
  createError?: unknown
}

function createHarness(options: HarnessOptions = {}) {
  environment = {
    APP_DISABLE_REGISTRATION: options.appDisableRegistration ?? false,
    DISABLE_LOGIN_WITH_OIDC: options.disableLoginWithOidc ?? false,
    OIDC_ALLOW_PROVISIONING: options.oidcAllowProvisioning ?? false,
    OIDC_SYNC_NAME: options.oidcSyncName ?? false
  }

  const servicePath = require.resolve('../src/service/social-login.service')
  delete require.cache[servicePath]
  const { SocialLoginService } = require(servicePath)
  const socialAccounts: Array<Record<string, unknown>> = []
  const createdUsers: Array<Record<string, unknown>> = []
  const userUpdates: Array<{ id: string; updates: Record<string, unknown> }> = []
  const socialQueries: Array<Record<string, unknown>> = []
  const users = options.users ?? []
  const socialModel = {
    findOne: async (query: Record<string, unknown>) => {
      socialQueries.push({ ...query })
      return options.existingSocialUserId ? { userId: options.existingSocialUserId } : null
    },
    create: async (data: Record<string, unknown>) => {
      socialAccounts.push({ ...data })
      return { id: 'social_account_1' }
    },
    deleteOne: async () => ({ deletedCount: 0 })
  }
  const userService = {
    findById: async (id: string) => users.find(user => user.id === id) ?? null,
    findByEmail: async (email: string) =>
      options.users
        ? (users.find(user => user.email === email) ?? null)
        : (options.existingUser ?? null),
    update: async (id: string, updates: Record<string, unknown>) => {
      userUpdates.push({ id, updates: { ...updates } })
      return true
    },
    create: async (user: Record<string, unknown>) => {
      if (options.racingUser) {
        users.push(options.racingUser)
        throw { code: 11000, keyPattern: { email: 1 }, keyValue: { email: user.email } }
      }
      if (options.createError) {
        throw options.createError
      }
      createdUsers.push({ ...user })
      return 'new_user_1'
    }
  }
  const service = new SocialLoginService(socialModel as any, userService as any)

  return { service, socialAccounts, socialQueries, createdUsers, userUpdates }
}

function oidcUserInfo(email?: string, emailVerified = false, providerName?: string) {
  return {
    openId: 'https://identity.example.com#subject_1',
    issuer: 'https://identity.example.com',
    subject: 'subject_1',
    emailVerified,
    providerName,
    user: {
      email,
      name: providerName ?? 'Example User',
      avatar: '',
      lang: 'en'
    }
  }
}

async function testNewOidcBindingRequiresVerifiedEmail() {
  for (const userInfo of [oidcUserInfo('user@example.com', false), oidcUserInfo(undefined, true)]) {
    const { service, socialAccounts, createdUsers } = createHarness()
    service.userInfo = async () => userInfo

    await assert.rejects(
      async () => service.authCallback('oidc', 'code'),
      /Social login provider must return a verified email address/
    )
    assert.strictEqual(createdUsers.length, 0)
    assert.strictEqual(socialAccounts.length, 0)
  }
}

async function testVerifiedEmailCanBindAnExistingUser() {
  const { service, socialAccounts, userUpdates } = createHarness({
    existingUser: { id: 'existing_user_1', email: 'user@example.com', isEmailVerified: false }
  })
  service.userInfo = async () => oidcUserInfo('user@example.com', true)

  assert.strictEqual(await service.authCallback('oidc', 'code'), 'existing_user_1')
  assert.deepStrictEqual(userUpdates, [
    { id: 'existing_user_1', updates: { isEmailVerified: true } }
  ])
  assert.deepStrictEqual(socialAccounts, [
    {
      kind: 'oidc',
      openId: 'https://identity.example.com#subject_1',
      userId: 'existing_user_1'
    }
  ])
}

async function testEmailTakenDuringProvisioningLinksThatAccount() {
  const { service, socialAccounts, createdUsers, userUpdates } = createHarness({
    users: [],
    racingUser: { id: 'racing_user_1', email: 'user@example.com', isEmailVerified: false }
  })
  service.userInfo = async () => oidcUserInfo('user@example.com', true)

  assert.strictEqual(await service.authCallback('oidc', 'code'), 'racing_user_1')
  assert.strictEqual(createdUsers.length, 0)
  assert.deepStrictEqual(userUpdates, [{ id: 'racing_user_1', updates: { isEmailVerified: true } }])
  assert.deepStrictEqual(socialAccounts, [
    {
      kind: 'oidc',
      openId: 'https://identity.example.com#subject_1',
      userId: 'racing_user_1'
    }
  ])
}

async function testOtherCreateErrorsAreNotTreatedAsATakenEmail() {
  const createError = { code: 11000, keyPattern: { customerId: 1 } }
  const { service, socialAccounts } = createHarness({ users: [], createError })
  service.userInfo = async () => oidcUserInfo('user@example.com', true)

  await assert.rejects(
    async () => service.authCallback('oidc', 'code'),
    error => error === createError
  )
  assert.strictEqual(socialAccounts.length, 0)
}

async function testProvisioningRequiresTheOidcOverrideWhenRegistrationIsDisabled() {
  const denied = createHarness({ appDisableRegistration: true, oidcAllowProvisioning: false })
  denied.service.userInfo = async () => oidcUserInfo('user@example.com', true)
  await assert.rejects(
    async () => denied.service.authCallback('oidc', 'code'),
    /Registration is disabled/
  )
  assert.strictEqual(denied.createdUsers.length, 0)
  assert.strictEqual(denied.socialAccounts.length, 0)

  const allowed = createHarness({ appDisableRegistration: true, oidcAllowProvisioning: true })
  allowed.service.userInfo = async () => oidcUserInfo('user@example.com', true)
  assert.strictEqual(await allowed.service.authCallback('oidc', 'code'), 'new_user_1')
  assert.deepStrictEqual(allowed.createdUsers, [
    {
      email: 'user@example.com',
      name: 'Example User',
      avatar: '',
      lang: 'en',
      isEmailVerified: true
    }
  ])
  assert.strictEqual(allowed.socialAccounts.length, 1)
}

async function testOidcProvisioningOverrideDoesNotEnableOtherProviders() {
  const { service, createdUsers } = createHarness({
    appDisableRegistration: true,
    oidcAllowProvisioning: true
  })
  service.userInfo = async () => ({
    openId: 'google_subject_1',
    emailVerified: true,
    user: { email: 'user@example.com', name: 'Example User', avatar: '' }
  })

  await assert.rejects(
    async () => service.authCallback(SocialLoginTypeEnum.GOOGLE, 'code'),
    /Registration is disabled/
  )
  assert.strictEqual(createdUsers.length, 0)
}

async function testPreviouslyBoundSubjectDoesNotDependOnMutableEmailClaims() {
  const { service, socialAccounts } = createHarness({ existingSocialUserId: 'linked_user_1' })
  service.userInfo = async () => oidcUserInfo(undefined, false)

  assert.strictEqual(await service.authCallback('oidc', 'code'), 'linked_user_1')
  assert.strictEqual(socialAccounts.length, 0)
}

const linkedUser = () => ({ id: 'linked_user_1', name: 'Old Name', email: 'old@example.com' })

async function testNameIsNotSyncedByDefault() {
  const { service, userUpdates } = createHarness({
    existingSocialUserId: 'linked_user_1',
    users: [linkedUser()]
  })
  service.userInfo = async () => oidcUserInfo('new@example.com', true, 'New Name')

  assert.strictEqual(await service.authCallback('oidc', 'code'), 'linked_user_1')
  assert.deepStrictEqual(userUpdates, [])
}

async function testSyncRefreshesTheNameAtEachLogin() {
  const { service, userUpdates } = createHarness({
    oidcSyncName: true,
    existingSocialUserId: 'linked_user_1',
    users: [linkedUser()]
  })
  service.userInfo = async () => oidcUserInfo('new@example.com', true, 'New Name')

  assert.strictEqual(await service.authCallback('oidc', 'code'), 'linked_user_1')
  // Only the name: the email is left as it is
  assert.deepStrictEqual(userUpdates, [{ id: 'linked_user_1', updates: { name: 'New Name' } }])
}

async function testSyncSkipsFallbackAndUnchangedNames() {
  // No `name` claim: the fallback (email prefix, subject) must not replace a real name
  const noName = createHarness({
    oidcSyncName: true,
    existingSocialUserId: 'linked_user_1',
    users: [linkedUser()]
  })
  noName.service.userInfo = async () => oidcUserInfo('old@example.com', true)
  await noName.service.authCallback('oidc', 'code')
  assert.deepStrictEqual(noName.userUpdates, [])

  const unchanged = createHarness({
    oidcSyncName: true,
    existingSocialUserId: 'linked_user_1',
    users: [linkedUser()]
  })
  unchanged.service.userInfo = async () => oidcUserInfo('old@example.com', true, 'Old Name')
  await unchanged.service.authCallback('oidc', 'code')
  assert.deepStrictEqual(unchanged.userUpdates, [])
}

async function testSyncAppliesWhenLinkingAnExistingUserButNotToNewOnes() {
  const existing = { id: 'existing_user_1', name: 'Old Name', email: 'user@example.com' }
  const linked = createHarness({
    oidcSyncName: true,
    existingUser: existing,
    users: [existing]
  })
  linked.service.userInfo = async () => oidcUserInfo('user@example.com', true, 'New Name')
  assert.strictEqual(await linked.service.authCallback('oidc', 'code'), 'existing_user_1')
  assert.deepStrictEqual(linked.userUpdates, [
    { id: 'existing_user_1', updates: { isEmailVerified: true } },
    { id: 'existing_user_1', updates: { name: 'New Name' } }
  ])

  const created = createHarness({ oidcSyncName: true, users: [] })
  created.service.userInfo = async () => oidcUserInfo('user@example.com', true, 'New Name')
  assert.strictEqual(await created.service.authCallback('oidc', 'code'), 'new_user_1')
  assert.deepStrictEqual(created.userUpdates, [])
}

async function testSyncIsOnlyForOidcLogins() {
  const { service, userUpdates } = createHarness({
    oidcSyncName: true,
    existingSocialUserId: 'linked_user_1',
    users: [linkedUser()]
  })
  service.userInfo = async () => ({
    openId: 'google_subject_1',
    emailVerified: true,
    providerName: 'New Name',
    user: { email: 'old@example.com', name: 'New Name', avatar: '' }
  })

  await service.authCallback(SocialLoginTypeEnum.GOOGLE, 'code')
  assert.deepStrictEqual(userUpdates, [])
}

async function testNameIsManagedOnlyForOidcAccountsWhileSyncIsOn() {
  const off = createHarness({ existingSocialUserId: 'linked_user_1' })
  assert.strictEqual(await off.service.isNameManaged('linked_user_1'), false)
  assert.deepStrictEqual(off.socialQueries, [])

  const oidcDisabled = createHarness({
    oidcSyncName: true,
    disableLoginWithOidc: true,
    existingSocialUserId: 'linked_user_1'
  })
  assert.strictEqual(await oidcDisabled.service.isNameManaged('linked_user_1'), false)

  const noAccount = createHarness({ oidcSyncName: true })
  assert.strictEqual(await noAccount.service.isNameManaged('user_1'), false)

  const on = createHarness({ oidcSyncName: true, existingSocialUserId: 'linked_user_1' })
  assert.strictEqual(await on.service.isNameManaged('linked_user_1'), true)
  assert.deepStrictEqual(on.socialQueries, [{ kind: 'oidc', userId: 'linked_user_1' }])
}

async function run() {
  await testNewOidcBindingRequiresVerifiedEmail()
  await testVerifiedEmailCanBindAnExistingUser()
  await testEmailTakenDuringProvisioningLinksThatAccount()
  await testOtherCreateErrorsAreNotTreatedAsATakenEmail()
  await testProvisioningRequiresTheOidcOverrideWhenRegistrationIsDisabled()
  await testOidcProvisioningOverrideDoesNotEnableOtherProviders()
  await testPreviouslyBoundSubjectDoesNotDependOnMutableEmailClaims()
  await testNameIsNotSyncedByDefault()
  await testSyncRefreshesTheNameAtEachLogin()
  await testSyncSkipsFallbackAndUnchangedNames()
  await testSyncAppliesWhenLinkingAnExistingUserButNotToNewOnes()
  await testSyncIsOnlyForOidcLogins()
  await testNameIsManagedOnlyForOidcAccountsWhileSyncIsOn()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
