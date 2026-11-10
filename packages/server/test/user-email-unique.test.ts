import assert from 'assert'

import { SignUpResolver } from '../src/resolver/auth/sign-up.resolver'
import { UpdateEmailResolver } from '../src/resolver/user/update-email.resolver'
import { UserService, isDuplicateEmailError } from '../src/service/user.service'
import { passwordHash } from '../src/utils'

const duplicateEmail = () => ({
  code: 11000,
  keyPattern: { email: 1 },
  keyValue: { email: 'user@heyform.net' }
})

const settle = () => new Promise(resolve => setImmediate(resolve))

function testDuplicateEmailErrorsAreRecognised() {
  assert.strictEqual(isDuplicateEmailError(duplicateEmail()), true)
  assert.strictEqual(isDuplicateEmailError({ code: 11000, keyPattern: { customerId: 1 } }), false)
  assert.strictEqual(isDuplicateEmailError({ code: 121, keyPattern: { email: 1 } }), false)
  assert.strictEqual(isDuplicateEmailError(new Error('E11000 duplicate key')), false)
  assert.strictEqual(isDuplicateEmailError(undefined), false)
}

function userServiceWith(init: () => Promise<unknown>, groups: Array<{ ids: unknown[] }> = []) {
  const errors: string[] = []
  const pipelines: unknown[] = []
  const model = {
    init,
    aggregate: async (pipeline: unknown) => {
      pipelines.push(pipeline)
      return groups
    }
  }
  const service = new UserService(model as any)
  ;(service as any).logger = { error: (message: string) => errors.push(message) }

  return { service, errors, pipelines }
}

async function testStartupNamesTheAccountsThatShareAnEmail() {
  const { service, errors } = userServiceWith(async () => {
    throw duplicateEmail()
  }, [{ ids: ['user_1', 'user_2'] }, { ids: ['user_3', 'user_4', 'user_5'] }])

  service.onModuleInit()
  await settle()

  assert.strictEqual(errors.length, 1)
  assert.match(errors[0], /unique email index on usermodels wasn't built/)
  assert.match(errors[0], /user_1, user_2; user_3, user_4, user_5$/)
}

async function testStartupStaysQuietWhenTheIndexBuilds() {
  const { service, errors, pipelines } = userServiceWith(async () => undefined)

  service.onModuleInit()
  await settle()

  assert.deepStrictEqual(errors, [])
  assert.deepStrictEqual(pipelines, [])
}

async function testStartupReportsOtherIndexErrors() {
  const { service, errors, pipelines } = userServiceWith(async () => {
    throw new Error('not authorized')
  })

  service.onModuleInit()
  await settle()

  assert.deepStrictEqual(errors, ["Couldn't build the users indexes: not authorized"])
  assert.deepStrictEqual(pipelines, [])
}

async function testSignUpRejectsAnEmailTakenAfterTheCheck() {
  let created = 0
  const userService = {
    findByEmail: async () => null,
    create: async () => {
      created++
      throw duplicateEmail()
    }
  }
  const resolver = new SignUpResolver(
    {} as any,
    userService as any,
    {} as any,
    {} as any,
    {} as any
  )

  await assert.rejects(
    () =>
      resolver.signUp({ lang: 'en', deviceId: 'device_1' } as any, {} as any, {
        name: 'Example User',
        email: 'user@heyform.net',
        password: 'Passw0rd!'
      }),
    /The email address already exist/
  )
  assert.strictEqual(created, 1)
}

async function testUpdateEmailRejectsAnEmailTakenAfterTheCheck() {
  let invalidated = 0
  const user = {
    id: 'user_1',
    email: 'old@heyform.net',
    password: await passwordHash('Passw0rd!', 10)
  }
  const authService = {
    attemptsCheck: async (_key: string, check: () => Promise<void>) => check(),
    checkVerificationCode: async () => undefined,
    invalidateSessions: async () => {
      invalidated++
    }
  }
  const userService = {
    findByEmail: async () => null,
    update: async () => {
      throw duplicateEmail()
    }
  }
  const resolver = new UpdateEmailResolver(authService as any, userService as any)

  await assert.rejects(
    () =>
      resolver.updateEmail(user as any, {
        email: 'user@heyform.net',
        code: '123456',
        currentPassword: 'Passw0rd!'
      }),
    /The email address is already exists/
  )
  assert.strictEqual(invalidated, 0)
}

async function testOtherWriteErrorsPassThrough() {
  const failure = new Error('connection reset')
  const resolver = new SignUpResolver(
    {} as any,
    {
      findByEmail: async () => null,
      create: async () => {
        throw failure
      }
    } as any,
    {} as any,
    {} as any,
    {} as any
  )

  await assert.rejects(
    () =>
      resolver.signUp({ lang: 'en', deviceId: 'device_1' } as any, {} as any, {
        name: 'Example User',
        email: 'user@heyform.net',
        password: 'Passw0rd!'
      }),
    error => error === failure
  )
}

async function run() {
  testDuplicateEmailErrorsAreRecognised()
  await testStartupNamesTheAccountsThatShareAnEmail()
  await testStartupStaysQuietWhenTheIndexBuilds()
  await testStartupReportsOtherIndexErrors()
  await testSignUpRejectsAnEmailTakenAfterTheCheck()
  await testUpdateEmailRejectsAnEmailTakenAfterTheCheck()
  await testOtherWriteErrorsPassThrough()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
