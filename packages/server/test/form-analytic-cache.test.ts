import * as assert from 'assert'

import {
  FORM_ANALYTIC_CACHE_CLEAR_TIMEOUT_MS,
  FormAnalyticRangeEnum,
  formAnalyticCacheKey,
  formAnalyticGenerationKey
} from '../src/model/form-analytic.model'
import { FormAnalyticResolver } from '../src/resolver/form/form-analytic.resolver'
import { FormAnalyticService } from '../src/service/form-analytic.service'
import { SubmissionService } from '../src/service/submission.service'

// A Redis that keeps values in memory and understands the commands the cache uses.
function memoryRedis() {
  const values = new Map<string, string>()
  const commands: any[][] = []

  return {
    values,
    commands,
    get: async (key: string) => values.get(key) ?? null,
    set: async ({ key, value }: { key: string; value: string }) => {
      values.set(key, value)
      return 'OK'
    },
    multi: async (batch: any[][]) => {
      commands.push(...batch)
      for (const [command, key] of batch) {
        if (command === 'incr') {
          values.set(key, String(Number(values.get(key) ?? 0) + 1))
        }
      }
      return batch.map(() => [null, 1])
    }
  }
}

const neverSettles = () => new Promise<never>(() => undefined)

function submissionService(redis: any) {
  const model = { create: async () => ({ id: 'submission_1' }) }
  return new SubmissionService(model as any, {} as any, redis)
}

function visitService(redis: any) {
  const model = { findOne: async () => null, create: async () => ({}) }
  return new FormAnalyticService(model as any, {} as any, redis)
}

async function assertSettlesWithinBound(promise: Promise<unknown>) {
  const startedAt = Date.now()
  let bound: NodeJS.Timeout | undefined

  const result = await Promise.race([
    promise,
    new Promise((_, reject) => {
      bound = setTimeout(
        () => reject(new Error('still waiting on Redis')),
        FORM_ANALYTIC_CACHE_CLEAR_TIMEOUT_MS * 4
      )
    })
  ]).finally(() => clearTimeout(bound))

  assert.ok(Date.now() - startedAt >= FORM_ANALYTIC_CACHE_CLEAR_TIMEOUT_MS - 50)
  return result
}

function testKeyFormat() {
  assert.strictEqual(
    formAnalyticCacheKey('form_1', FormAnalyticRangeEnum.WEEK, '3'),
    'form:form_1:analytic:7d:3'
  )
  assert.strictEqual(formAnalyticGenerationKey('form_1'), 'form:form_1:analytic:generation')
}

async function testVisitBumpsTheGeneration() {
  const redis = memoryRedis()

  await visitService(redis).updateTotalVisits('form_1')

  assert.strictEqual(redis.values.get(formAnalyticGenerationKey('form_1')), '1')
  assert.ok(redis.commands.some(([command]) => command === 'expire'))
}

async function testSubmissionBumpsTheGeneration() {
  const redis = memoryRedis()

  assert.strictEqual(await submissionService(redis).create({ formId: 'form_1' }), 'submission_1')
  assert.strictEqual(redis.values.get(formAnalyticGenerationKey('form_1')), '1')
}

async function testRedisErrorDoesNotFailTheSubmission() {
  const redis = {
    multi: async () => {
      throw new Error('redis down')
    }
  }

  assert.strictEqual(await submissionService(redis).create({ formId: 'form_1' }), 'submission_1')
}

async function testUnresponsiveRedisDoesNotHoldTheSubmission() {
  const redis = { multi: neverSettles }

  const id = await assertSettlesWithinBound(submissionService(redis).create({ formId: 'form_1' }))

  assert.strictEqual(id, 'submission_1')
}

async function testUnresponsiveRedisDoesNotHoldTheVisit() {
  const redis = { multi: neverSettles }

  await assertSettlesWithinBound(visitService(redis).updateTotalVisits('form_1'))
}

// A query reads the old numbers, a submission lands and invalidates, then the
// query finishes and writes its old result. The next query must not serve it.
async function testLateWriteFromAnInFlightQueryIsNeverServed() {
  const redis = memoryRedis()
  const stored = { submissions: 0 }
  let releaseFirstQuery: () => void = () => undefined
  const firstQueryHeld = new Promise<void>(resolve => (releaseFirstQuery = resolve))
  let calls = 0

  const analytics = {
    summary: async () => {
      const submissions = stored.submissions
      // The first query's two summaries read the old numbers, then wait.
      if (calls++ < 2) {
        await firstQueryHeld
      }
      return { avgTotalVisits: 1, avgSubmissionCount: submissions, avgAverageTime: 0 }
    }
  }
  const resolver = new FormAnalyticResolver(analytics as any, redis as any)
  const input = { formId: 'form_1', range: FormAnalyticRangeEnum.WEEK }

  const firstQuery = resolver.formAnalytic(input as any)
  await new Promise(resolve => setImmediate(resolve))

  stored.submissions = 1
  await submissionService(redis).create({ formId: 'form_1' })

  releaseFirstQuery()
  assert.strictEqual((await firstQuery).submissionCount.value, 0)

  const nextQuery = await resolver.formAnalytic(input as any)
  assert.strictEqual(nextQuery.submissionCount.value, 1)
}

async function run() {
  testKeyFormat()
  await testVisitBumpsTheGeneration()
  await testSubmissionBumpsTheGeneration()
  await testRedisErrorDoesNotFailTheSubmission()
  await testUnresponsiveRedisDoesNotHoldTheSubmission()
  await testUnresponsiveRedisDoesNotHoldTheVisit()
  await testLateWriteFromAnInFlightQueryIsNeverServed()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
