import * as assert from 'assert'

// The environment is read when the modules load, so set it before requiring them
process.env.DISABLE_SUBMISSION_IP = 'true'
process.env.FORM_ENCRYPTION_KEY ||= 'test-form-encryption-key'

/* eslint-disable @typescript-eslint/no-var-requires */
const { CaptchaKindEnum, FieldKindEnum } = require('@heyform-inc/shared-types-enums')
const {
  CompleteSubmissionResolver
} = require('../src/resolver/endpoint/complete-submission.resolver')
const { SubmissionIpLimitService } = require('../src/service/submission-ip-limit.service')
const { isSubmissionIpVisible } = require('../src/utils/submission')
/* eslint-enable @typescript-eslint/no-var-requires */

const IP = '203.0.113.10'

function testFormSettingCannotShowIps() {
  assert.strictEqual(isSubmissionIpVisible({ settings: { displayIpAddress: true } }), false)
}

async function testSubmissionIsSavedWithoutTheIp() {
  let storedSubmission: Record<string, any> | undefined
  let checkedIp: string | undefined
  const now = Math.floor(Date.now() / 1_000)
  const form = {
    id: 'form_1',
    teamId: 'team_1',
    name: 'Form',
    suspended: false,
    fields: [
      {
        id: 'name',
        title: 'Name',
        kind: FieldKindEnum.SHORT_TEXT,
        validations: { required: true }
      }
    ],
    hiddenFields: [],
    logics: [],
    variables: [],
    settings: {
      active: true,
      captchaKind: CaptchaKindEnum.NONE,
      enableIpLimit: true,
      ipLimitCount: 1
    }
  }
  const resolver = new CompleteSubmissionResolver(
    {
      decryptToken: () => ({ formId: 'form_1', timestamp: now }),
      assertOpenToken: () => now
    } as any,
    { findById: async () => form } as any,
    {
      createWithinQuota: async (submission: Record<string, any>) => {
        storedSubmission = submission
        return 'submission_1'
      },
      countInForm: async () => 0
    } as any,
    {
      checkIp: async (_form: unknown, ip: string) => {
        checkedIp = ip
      }
    } as any,
    { addQueue: () => undefined } as any,
    { addQueue: () => undefined } as any,
    {} as any
  )

  await resolver.completeSubmission(
    { ip: IP, deviceId: 'device_1', lang: 'en', userAgent: {} as any },
    'anonymous_1',
    {
      formId: 'form_1',
      answers: { name: 'Ada' },
      hiddenFields: [],
      openToken: 'encrypted-token'
    }
  )

  assert.strictEqual(storedSubmission?.answers[0].value, 'Ada')
  assert.strictEqual(storedSubmission?.ip, undefined)
  // The per-IP limit still sees the address, and hashes it before storing it
  assert.strictEqual(checkedIp, IP)
}

async function testIpLimitStoresAHashOfTheIp() {
  const created: Record<string, any>[] = []
  const service = new SubmissionIpLimitService({
    findOne: async () => null,
    findOneAndUpdate: async () => null,
    create: async (data: Record<string, any>) => {
      created.push(data)
      return { id: 'limit_1' }
    }
  } as any)
  const form = { id: 'form_1', settings: { ipLimitCount: 1 } }

  await service.checkIp(form, IP)
  await service.checkIp(form, IP)
  await service.checkIp(form, '203.0.113.11')

  assert.notStrictEqual(created[0].ip, IP)
  assert.ok(!created[0].ip.includes('203.0.113'))
  assert.strictEqual(created[0].ip, created[1].ip)
  assert.notStrictEqual(created[0].ip, created[2].ip)
}

async function testIpLimitRekeysACountKeptUnderTheRawIp() {
  const rekeys: Record<string, any>[] = []
  const updates: Record<string, any>[] = []
  const service = new SubmissionIpLimitService({
    findOne: async () => null,
    findOneAndUpdate: async (filter: Record<string, any>, update: Record<string, any>) => {
      rekeys.push({ filter, update })
      return { id: 'limit_1', count: 2, expiredAt: 0 }
    },
    updateOne: async (_filter: unknown, update: Record<string, any>) => {
      updates.push(update)
    },
    create: async () => {
      throw new Error('The existing count should be reused')
    }
  } as any)

  await service.checkIp({ id: 'form_1', settings: { ipLimitCount: 5 } }, IP)

  // The count saved under the raw address now sits under its hash
  assert.strictEqual(rekeys[0].filter.ip, IP)
  assert.notStrictEqual(rekeys[0].update.ip, IP)
  assert.ok(!rekeys[0].update.ip.includes('203.0.113'))
  assert.strictEqual(updates[0].count, 3)
}

async function testIpLimitUsesACountAnotherSubmissionJustMoved() {
  let lookups = 0
  const updates: Record<string, any>[] = []
  const service = new SubmissionIpLimitService({
    // Missing on the first lookup, there once the other submission has moved it
    findOne: async () => (++lookups === 1 ? null : { id: 'limit_1', count: 1, expiredAt: 0 }),
    findOneAndUpdate: async () => null,
    updateOne: async (_filter: unknown, update: Record<string, any>) => {
      updates.push(update)
    },
    create: async () => {
      throw new Error('E11000 duplicate key')
    }
  } as any)

  await service.checkIp({ id: 'form_1', settings: { ipLimitCount: 5 } }, IP)

  assert.strictEqual(updates[0].count, 2)
}

async function run() {
  testFormSettingCannotShowIps()
  await testSubmissionIsSavedWithoutTheIp()
  await testIpLimitStoresAHashOfTheIp()
  await testIpLimitRekeysACountKeptUnderTheRawIp()
  await testIpLimitUsesACountAnotherSubmissionJustMoved()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
