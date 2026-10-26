import * as assert from 'assert'

import { FormAnalyticRangeEnum, formAnalyticCacheKey } from '../src/model/form-analytic.model'
import { FormAnalyticService } from '../src/service/form-analytic.service'
import { SubmissionService } from '../src/service/submission.service'

const ALL_RANGES = Object.values(FormAnalyticRangeEnum).map(range =>
  formAnalyticCacheKey('form_1', range)
)

function recordingRedis() {
  const deleted: string[] = []
  return { deleted, redis: { del: async (key: string) => (deleted.push(key), 1) } }
}

function testKeyFormatIsUnchanged() {
  // Existing cache entries must still be found (and cleared) after an upgrade.
  assert.strictEqual(
    formAnalyticCacheKey('form_1', FormAnalyticRangeEnum.WEEK),
    'form:form_1:analytic:7d'
  )
}

async function testVisitClearsEveryRange() {
  const { deleted, redis } = recordingRedis()
  const model = {
    findOne: async () => null,
    create: async () => ({})
  }
  const service = new FormAnalyticService(model as any, {} as any, redis as any)

  await service.updateTotalVisits('form_1')

  assert.deepStrictEqual(deleted.sort(), [...ALL_RANGES].sort())
}

async function testSubmissionClearsEveryRange() {
  const { deleted, redis } = recordingRedis()
  const model = { create: async () => ({ id: 'submission_1' }) }
  const service = new SubmissionService(model as any, {} as any, redis as any)

  const id = await service.create({ formId: 'form_1' })

  assert.strictEqual(id, 'submission_1')
  assert.deepStrictEqual(deleted.sort(), [...ALL_RANGES].sort())
}

async function testRedisFailureDoesNotFailTheSubmission() {
  const model = { create: async () => ({ id: 'submission_1' }) }
  const redis = {
    del: async () => {
      throw new Error('redis down')
    }
  }
  const service = new SubmissionService(model as any, {} as any, redis as any)

  assert.strictEqual(await service.create({ formId: 'form_1' }), 'submission_1')
}

async function run() {
  testKeyFormatIsUnchanged()
  await testVisitClearsEveryRange()
  await testSubmissionClearsEveryRange()
  await testRedisFailureDoesNotFailTheSubmission()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
