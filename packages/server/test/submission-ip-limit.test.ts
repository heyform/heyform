import * as assert from 'assert'

// The environment is read when the modules load, so set it before requiring them
delete process.env.DISABLE_SUBMISSION_IP
process.env.FORM_ENCRYPTION_KEY ||= 'test-form-encryption-key'

/* eslint-disable @typescript-eslint/no-var-requires */
const { SubmissionIpLimitService } = require('../src/service/submission-ip-limit.service')
/* eslint-enable @typescript-eslint/no-var-requires */

const IP = '203.0.113.10'

async function testIpLimitStoresTheIp() {
  const created: Record<string, any>[] = []
  const service = new SubmissionIpLimitService({
    findOne: async () => null,
    findOneAndUpdate: async () => null,
    create: async (data: Record<string, any>) => {
      created.push(data)
      return { id: 'limit_1' }
    }
  } as any)

  await service.checkIp({ id: 'form_1', settings: { ipLimitCount: 1 } }, IP)

  assert.strictEqual(created[0].ip, IP)
}

async function testIpLimitRekeysACountKeptUnderTheHash() {
  const rekeys: Record<string, any>[] = []
  const service = new SubmissionIpLimitService({
    findOne: async () => null,
    findOneAndUpdate: async (filter: Record<string, any>, update: Record<string, any>) => {
      rekeys.push({ filter, update })
      return { id: 'limit_1', count: 1, expiredAt: 0 }
    },
    updateOne: async () => undefined,
    create: async () => {
      throw new Error('The existing count should be reused')
    }
  } as any)

  // A count kept while DISABLE_SUBMISSION_IP was set still applies
  await assert.rejects(
    () => service.checkIp({ id: 'form_1', settings: { ipLimitCount: 1 } }, IP),
    /no longer accepted/
  )
  assert.notStrictEqual(rekeys[0].filter.ip, IP)
  assert.strictEqual(rekeys[0].update.ip, IP)
}

async function run() {
  await testIpLimitStoresTheIp()
  await testIpLimitRekeysACountKeptUnderTheHash()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
