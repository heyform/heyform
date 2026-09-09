import * as assert from 'assert'
import * as bcrypt from 'bcrypt'

import { LoginResolver } from '../src/resolver/auth/login.resolver'
import { SignUpResolver } from '../src/resolver/auth/sign-up.resolver'

const environments = require('@environments')

async function testPasswordRegistrationPolicy() {
  const originalPasswordFlag = environments.DISABLE_LOGIN_WITH_PASSWORD
  const originalRegistrationFlag = environments.APP_DISABLE_REGISTRATION
  let lookups = 0
  let creations = 0
  let sessions = 0
  const resolver = new SignUpResolver(
    {
      createUserActivity: () => undefined,
      login: async () => {
        sessions += 1
      },
      getVerificationCodeWithRateLimit: async () => '123456'
    } as any,
    {
      findByEmail: async () => {
        lookups += 1
        return null
      },
      create: async () => {
        creations += 1
        return 'new-user'
      },
      findById: async () => null
    } as any,
    { emailVerificationRequest: () => undefined } as any,
    {
      findJoinableByInvite: async () => {
        lookups += 1
        return { id: 'team-1', ownerId: 'owner' }
      },
      createMember: async () => undefined
    } as any
  )
  const client = { deviceId: 'device-1', lang: 'en' } as any
  const response = { clearCookie: () => undefined }
  const input = { name: 'New user', email: 'new-user@heyform.net', password: 'StrongPassword1!' }
  const invitation = { teamId: 'team-1', inviteCode: 'invite-1' }
  try {
    environments.DISABLE_LOGIN_WITH_PASSWORD = true
    for (const registrationDisabled of [false, true]) {
      environments.APP_DISABLE_REGISTRATION = registrationDisabled
      for (const details of [input, { ...input, ...invitation }]) {
        await assert.rejects(
          () => resolver.signUp(client, response, details),
          (error: any) =>
            error.getStatus() === 403 && error.message === 'Password registration is disabled.'
        )
      }
    }
    assert.strictEqual(lookups, 0)
    assert.strictEqual(creations, 0)
    assert.strictEqual(sessions, 0)

    environments.DISABLE_LOGIN_WITH_PASSWORD = false
    environments.APP_DISABLE_REGISTRATION = false
    assert.strictEqual(await resolver.signUp(client, response, input), true)
    environments.APP_DISABLE_REGISTRATION = true
    await assert.rejects(() => resolver.signUp(client, response, input), /Registration is disabled/)
    assert.strictEqual(await resolver.signUp(client, response, { ...input, ...invitation }), true)
    assert.strictEqual(creations, 2)
    assert.strictEqual(sessions, 2)
  } finally {
    environments.DISABLE_LOGIN_WITH_PASSWORD = originalPasswordFlag
    environments.APP_DISABLE_REGISTRATION = originalRegistrationFlag
  }
}

async function run() {
  await testPasswordRegistrationPolicy()
  const original = environments.DISABLE_LOGIN_WITH_PASSWORD
  const password = 'StrongPassword1!'
  const passwordHash = await bcrypt.hash(password, 4)
  let lookups = 0
  let sessions = 0
  const resolver = new LoginResolver(
    {
      attemptsCheck: async (_key: string, check: () => Promise<void>) => check(),
      clearAttempts: async () => undefined,
      devices: async () => ['device_1'],
      createUserActivity: async () => undefined,
      login: async () => {
        sessions += 1
      }
    } as any,
    {
      findByEmail: async () => {
        lookups += 1
        return { id: 'user_1', password: passwordHash }
      }
    } as any,
    {} as any
  )
  const client = { ip: '203.0.113.10', deviceId: 'device_1' } as any
  const input = { email: 'user@example.com', password }

  try {
    environments.DISABLE_LOGIN_WITH_PASSWORD = true
    await assert.rejects(
      () => resolver.login(client, {}, {}, input),
      (error: any) => error.getStatus() === 403 && error.message === 'Password login is disabled.'
    )
    assert.strictEqual(lookups, 0)
    assert.strictEqual(sessions, 0)

    environments.DISABLE_LOGIN_WITH_PASSWORD = false
    await assert.rejects(
      () => resolver.login(client, {}, {}, { ...input, password: 'wrong-password' }),
      /Incorrect email or password/
    )
    assert.strictEqual(sessions, 0)
    assert.strictEqual(await resolver.login(client, {}, {}, input), true)
    assert.strictEqual(sessions, 1)
  } finally {
    environments.DISABLE_LOGIN_WITH_PASSWORD = original
  }
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
