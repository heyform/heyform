import * as assert from 'assert'

const Module = require('module')
const originalLoad = Module._load

const SocialLoginTypeEnum = {
  APPLE: 'apple',
  GOOGLE: 'google',
  GOOGLE_ONE_TAP: 'google-one-tap'
}

let environment = {
  APP_DISABLE_REGISTRATION: false,
  OIDC_ALLOW_PROVISIONING: false
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
          (Array.isArray(value) && value.length === 0)
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
      DISABLE_LOGIN_WITH_OIDC: false,
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
      googleUserInfo: async () => undefined
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
  oidcAllowProvisioning?: boolean
  existingSocialUserId?: string
  existingUser?: Record<string, unknown> | null
}

function createHarness(options: HarnessOptions = {}) {
  environment = {
    APP_DISABLE_REGISTRATION: options.appDisableRegistration ?? false,
    OIDC_ALLOW_PROVISIONING: options.oidcAllowProvisioning ?? false
  }

  const servicePath = require.resolve('../src/service/social-login.service')
  delete require.cache[servicePath]
  const { SocialLoginService } = require(servicePath)
  const socialAccounts: Array<Record<string, unknown>> = []
  const createdUsers: Array<Record<string, unknown>> = []
  const userUpdates: Array<{ id: string; updates: Record<string, unknown> }> = []
  const socialModel = {
    findOne: async () =>
      options.existingSocialUserId ? { userId: options.existingSocialUserId } : null,
    create: async (data: Record<string, unknown>) => {
      socialAccounts.push({ ...data })
      return { id: 'social_account_1' }
    },
    deleteOne: async () => ({ deletedCount: 0 })
  }
  const userService = {
    findByEmail: async () => options.existingUser ?? null,
    update: async (id: string, updates: Record<string, unknown>) => {
      userUpdates.push({ id, updates: { ...updates } })
      return true
    },
    create: async (user: Record<string, unknown>) => {
      createdUsers.push({ ...user })
      return 'new_user_1'
    }
  }
  const service = new SocialLoginService(socialModel as any, userService as any)

  return { service, socialAccounts, createdUsers, userUpdates }
}

function oidcUserInfo(email?: string, emailVerified = false) {
  return {
    openId: 'https://identity.example.com#subject_1',
    issuer: 'https://identity.example.com',
    subject: 'subject_1',
    emailVerified,
    user: {
      email,
      name: 'Example User',
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

async function run() {
  await testNewOidcBindingRequiresVerifiedEmail()
  await testVerifiedEmailCanBindAnExistingUser()
  await testProvisioningRequiresTheOidcOverrideWhenRegistrationIsDisabled()
  await testOidcProvisioningOverrideDoesNotEnableOtherProviders()
  await testPreviouslyBoundSubjectDoesNotDependOnMutableEmailClaims()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
