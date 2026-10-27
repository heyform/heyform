import { FieldKindEnum, SubmissionCategoryEnum } from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { SubmissionService } from '../src/service/submission.service'
import { collectChoiceLimits } from '../src/utils/submission'

const FIELD_ID = 'field_1'

type StoredSubmission = Record<string, any>

function answerOf(...choiceIds: string[]) {
  return {
    id: FIELD_ID,
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    value: { value: choiceIds }
  }
}

function submissionOf(choiceId: string, category = SubmissionCategoryEnum.INBOX): StoredSubmission {
  return { formId: 'form_1', category, answers: [answerOf(choiceId)] }
}

// Stand-in for the Mongoose model. `aggregate` replays what the pipeline of countByChoices asks
// for (form, non-spam, fields, choices) over the in-memory submissions.
function createFakeModel(submissions: StoredSubmission[]) {
  const stage = (pipeline: any[], key: string) => pipeline.find(row => row[key])[key]

  return {
    countDocuments: async ({ formId }: { formId: string }) =>
      submissions.filter(submission => submission.formId === formId).length,
    create: async (submission: StoredSubmission) => {
      await new Promise(resolve => setTimeout(resolve, 1))
      submissions.push(submission)
      return { id: `submission_${submissions.length}` }
    },
    aggregate: async (pipeline: any[]) => {
      const { formId, category, 'answers.id': fieldMatch } = stage(pipeline, '$match')
      const choiceIds: string[] = pipeline[4].$match['answers.value.value'].$in
      const counts = new Map<string, number>()

      for (const submission of submissions) {
        if (submission.formId !== formId || submission.category === category.$ne) {
          continue
        }

        for (const answer of submission.answers) {
          if (!fieldMatch.$in.includes(answer.id)) {
            continue
          }

          for (const choiceId of answer.value.value) {
            if (choiceIds.includes(choiceId)) {
              const key = `${answer.id}:${choiceId}`
              counts.set(key, (counts.get(key) || 0) + 1)
            }
          }
        }
      }

      return Array.from(counts.entries()).map(([key, count]) => {
        const [f, c] = key.split(':')
        return { _id: { f, c }, count }
      })
    }
  }
}

// Stand-in for RedisService: locks are granted one at a time, in order.
function createFakeRedis() {
  let tail = Promise.resolve()
  const redis = {
    locks: 0,
    withLock: async (_key: string, _ttl: string, callback: () => Promise<unknown>) => {
      redis.locks += 1

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

  return redis
}

function createService(submissions: StoredSubmission[]) {
  const redis = createFakeRedis()
  const service = new SubmissionService(
    createFakeModel(submissions) as any,
    {} as any,
    redis as any
  )

  return { service, redis }
}

const limitOf = (choiceId: string, limit: number) => ({
  fieldId: FIELD_ID,
  choiceId,
  label: `Option ${choiceId}`,
  limit
})

async function testConcurrentCreatesCannotExceedChoiceLimit() {
  const submissions: StoredSubmission[] = []
  const { service } = createService(submissions)

  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () =>
      service.createWithinQuota(submissionOf('a'), undefined, [limitOf('a', 5)])
    )
  )

  const rejected = results.filter(result => result.status === 'rejected') as PromiseRejectedResult[]

  assert.strictEqual(results.filter(result => result.status === 'fulfilled').length, 5)
  assert.strictEqual(rejected.length, 15)
  assert.strictEqual(submissions.length, 5)
  assert.ok(rejected[0].reason.message.includes('Option a'))
}

async function testOtherChoicesStayOpenWhenOneChoiceIsFull() {
  const submissions = [submissionOf('a'), submissionOf('a')]
  const { service } = createService(submissions)
  const fields = [
    {
      id: FIELD_ID,
      kind: FieldKindEnum.MULTIPLE_CHOICE,
      properties: {
        choices: [
          { id: 'a', label: 'A', limit: 2 },
          { id: 'b', label: 'B' }
        ]
      }
    }
  ] as any

  await service.createWithinQuota(
    submissionOf('b'),
    undefined,
    collectChoiceLimits(fields, [answerOf('b')] as any)
  )
  assert.strictEqual(submissions.length, 3)

  await assert.rejects(
    service.createWithinQuota(
      submissionOf('a'),
      undefined,
      collectChoiceLimits(fields, [answerOf('a')] as any)
    ),
    /"A" is full/
  )
  assert.strictEqual(submissions.length, 3)
}

async function testSpamIsNotCountedUntilItIsRestored() {
  const spam = submissionOf('a', SubmissionCategoryEnum.SPAM)
  const submissions = [spam, submissionOf('a')]
  const { service } = createService(submissions)

  // One real submission and one spam: a limit of 2 still has a free place
  await service.createWithinQuota(submissionOf('a'), undefined, [limitOf('a', 2)])
  assert.strictEqual(submissions.length, 3)

  // Restoring the spam counts it, even above the limit, and closes the choice
  spam.category = SubmissionCategoryEnum.INBOX
  await assert.rejects(
    service.createWithinQuota(submissionOf('a'), undefined, [limitOf('a', 2)]),
    /is full/
  )
  assert.strictEqual(submissions.length, 3)
}

async function testNoLimitKeepsTheFastPath() {
  const submissions: StoredSubmission[] = []
  const { service, redis } = createService(submissions)

  await service.createWithinQuota(submissionOf('a'))
  await service.createWithinQuota(submissionOf('a'), undefined, [])

  assert.strictEqual(submissions.length, 2)
  assert.strictEqual(redis.locks, 0)
}

async function testFormQuotaAndChoiceLimitWorkTogether() {
  const submissions = [submissionOf('b'), submissionOf('b')]
  const { service } = createService(submissions)

  // The form quota is reached even though the choice still has room
  await assert.rejects(
    service.createWithinQuota(submissionOf('a'), 2, [limitOf('a', 5)]),
    /submission quota exceeds/
  )

  // The quota has room but the choice is full
  submissions.push(submissionOf('a'))
  await assert.rejects(
    service.createWithinQuota(submissionOf('a'), 10, [limitOf('a', 1)]),
    /is full/
  )
  assert.strictEqual(submissions.length, 3)
}

function testCollectChoiceLimits() {
  const fields = [
    {
      id: FIELD_ID,
      kind: FieldKindEnum.MULTIPLE_CHOICE,
      properties: {
        choices: [
          { id: 'a', label: 'A', limit: 3 },
          { id: 'b', label: 'B', limit: 0 },
          { id: 'c', label: 'C', limit: 1.5 },
          { id: 'd', label: 'D', limit: '4' },
          { id: 'e', label: 'E' },
          { id: 'f', label: 'F', limit: 2 }
        ]
      }
    },
    {
      id: 'field_2',
      kind: FieldKindEnum.PICTURE_CHOICE,
      properties: { choices: [{ id: 'p', label: 'P', limit: 7 }] }
    }
  ] as any

  const pick = (id: string, kind: FieldKindEnum, value: any) => ({ id, kind, value }) as any

  // Only valid limits on picked choices are returned, unpicked choices are not
  assert.deepStrictEqual(
    collectChoiceLimits(fields, [
      pick(FIELD_ID, FieldKindEnum.MULTIPLE_CHOICE, { value: ['a', 'b', 'c', 'd', 'e'] })
    ]),
    [{ fieldId: FIELD_ID, choiceId: 'a', label: 'A', limit: 3 }]
  )

  // Picture choice is covered, other kinds are ignored
  assert.deepStrictEqual(
    collectChoiceLimits(fields, [
      pick('field_2', FieldKindEnum.PICTURE_CHOICE, { value: ['p'] }),
      pick('field_3', FieldKindEnum.SHORT_TEXT, { value: ['x'] })
    ]),
    [{ fieldId: 'field_2', choiceId: 'p', label: 'P', limit: 7 }]
  )
}

async function run() {
  testCollectChoiceLimits()
  await testConcurrentCreatesCannotExceedChoiceLimit()
  await testOtherChoicesStayOpenWhenOneChoiceIsFull()
  await testSpamIsNotCountedUntilItIsRestored()
  await testNoLimitKeepsTheFastPath()
  await testFormQuotaAndChoiceLimitWorkTogether()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
