import * as assert from 'assert'

import { SubmissionSchema } from '../src/model/submission.model'
import { SubmissionService, generatePseudonymId } from '../src/service/submission.service'

function testPseudonymIdFormat() {
  for (let index = 0; index < 100; index += 1) {
    assert.match(generatePseudonymId(), /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/)
  }
}

function testPseudonymIdUniqueIndex() {
  const index = SubmissionSchema.indexes().find(
    ([fields]) => fields.formId === 1 && fields.pseudonymId === 1
  )

  assert.ok(index)
  assert.strictEqual(index?.[1]?.unique, true)
  assert.deepStrictEqual(index?.[1]?.partialFilterExpression, {
    pseudonymId: { $type: 'string' }
  })
}

async function testPseudonymIdCollisionIsRetried() {
  const attemptedIds: string[] = []
  const generatedIds = ['7KQ2-9MX4', 'ABCD-EFGH']
  const model = {
    create: async (submission: Record<string, any>) => {
      attemptedIds.push(submission.pseudonymId)

      if (attemptedIds.length === 1) {
        throw {
          code: 11000,
          keyPattern: { formId: 1, pseudonymId: 1 },
          keyValue: { formId: submission.formId, pseudonymId: submission.pseudonymId }
        }
      }

      return { id: 'submission_1' }
    }
  }
  const service = new SubmissionService(model as any, {} as any, {} as any)
  const result = await service.createWithPseudonymWithinQuota(
    { formId: 'form_1' },
    undefined,
    () => generatedIds.shift()!
  )

  assert.deepStrictEqual(attemptedIds, ['7KQ2-9MX4', 'ABCD-EFGH'])
  assert.deepStrictEqual(result, {
    id: 'submission_1',
    pseudonymId: 'ABCD-EFGH'
  })
}

async function testConcurrentCreatesCannotExceedQuota() {
  const submissions: Array<Record<string, any>> = []
  const model = {
    countDocuments: async ({ formId }: { formId: string }) =>
      submissions.filter(submission => submission.formId === formId).length,
    create: async (submission: Record<string, any>) => {
      await new Promise(resolve => setTimeout(resolve, 1))
      submissions.push(submission)
      return { id: `submission_${submissions.length}` }
    }
  }
  let tail = Promise.resolve()
  const redisService = {
    withLock: async (_key: string, _ttl: string, callback: () => Promise<unknown>) => {
      const previous = tail
      let release!: () => void
      tail = new Promise<void>(resolve => {
        release = resolve
      })
      await previous

      try {
        return await callback()
      } finally {
        release()
      }
    }
  }
  const service = new SubmissionService(model as any, {} as any, redisService as any)

  const results = await Promise.allSettled(
    Array.from({ length: 20 }, (_, index) =>
      service.createWithinQuota({ formId: 'form_1', value: index }, 5)
    )
  )

  assert.strictEqual(results.filter(result => result.status === 'fulfilled').length, 5)
  assert.strictEqual(results.filter(result => result.status === 'rejected').length, 15)
  assert.strictEqual(submissions.length, 5)
}

async function run() {
  testPseudonymIdFormat()
  testPseudonymIdUniqueIndex()
  await testPseudonymIdCollisionIsRetried()
  await testConcurrentCreatesCannotExceedQuota()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
