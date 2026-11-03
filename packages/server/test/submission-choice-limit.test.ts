import {
  CaptchaKindEnum,
  FieldKindEnum,
  SubmissionCategoryEnum
} from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { CompleteSubmissionResolver } from '../src/resolver/endpoint/complete-submission.resolver'
import { SubmissionService } from '../src/service/submission.service'
import { assertOpenToken } from '../src/utils/endpoint'
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

// checkIp() counts the submission, so a respondent told that an option is full must get the
// attempt back and still be able to pick another one.
async function testRejectedChoiceDoesNotUseUpTheIpLimit() {
  const now = Math.floor(Date.now() / 1_000)
  const form = {
    id: 'form_1',
    teamId: 'team_1',
    name: 'Workshops',
    suspended: false,
    fields: [
      {
        id: FIELD_ID,
        title: 'Workshop',
        kind: FieldKindEnum.MULTIPLE_CHOICE,
        validations: {},
        properties: {
          allowMultiple: false,
          choices: [
            { id: 'a', label: 'Option a', limit: 1 },
            { id: 'b', label: 'Option b' }
          ]
        }
      },
      { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU }
    ],
    hiddenFields: [],
    logics: [],
    variables: [],
    settings: {
      active: true,
      allowArchive: true,
      captchaKind: CaptchaKindEnum.NONE,
      enableIpLimit: true,
      ipLimitCount: 1
    }
  }
  const submissions = [submissionOf('a')]
  const calls = { ip: 0, release: 0 }
  const { service } = createService(submissions)
  const resolver = new CompleteSubmissionResolver(
    {
      decryptToken: () => ({ formId: form.id, timestamp: now }),
      assertOpenToken: () => now
    } as any,
    { findById: async () => structuredClone(form) } as any,
    service,
    {
      checkIp: async () => {
        calls.ip++
      },
      releaseIp: async () => {
        calls.release++
      }
    } as any,
    { addQueue: () => undefined } as any,
    { addQueue: () => undefined } as any,
    {} as any
  )
  const submit = (choiceId: string) =>
    resolver.completeSubmission(
      { ip: '203.0.113.10', deviceId: 'device_1', lang: 'en', userAgent: {} } as any,
      'anonymous_1',
      {
        formId: form.id,
        answers: { [FIELD_ID]: { value: [choiceId] } },
        hiddenFields: [],
        openToken: 'encrypted-token'
      } as any
    )

  await assert.rejects(() => submit('a'), /"Option a" is full/)
  assert.deepStrictEqual(calls, { ip: 1, release: 1 })

  // A stored submission keeps its count
  await submit('b')
  assert.strictEqual(submissions.length, 2)
  assert.deepStrictEqual(calls, { ip: 2, release: 1 })
}

// A partial submission (sent when the time runs out) is checked and counted like any other
async function testPartialSubmissionsRespectAndUseTheLimits() {
  const form = {
    id: 'form_1',
    teamId: 'team_1',
    name: 'Timed workshops',
    suspended: false,
    fields: [
      {
        id: FIELD_ID,
        title: 'Workshop',
        kind: FieldKindEnum.MULTIPLE_CHOICE,
        validations: {},
        properties: {
          allowMultiple: false,
          choices: [
            { id: 'a', label: 'Option a', limit: 1 },
            { id: 'b', label: 'Option b', limit: 1 }
          ]
        }
      },
      {
        id: 'name',
        title: 'Name',
        kind: FieldKindEnum.SHORT_TEXT,
        validations: { required: true }
      },
      { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU }
    ],
    hiddenFields: [],
    logics: [],
    variables: [],
    settings: {
      active: true,
      allowArchive: true,
      captchaKind: CaptchaKindEnum.NONE,
      enableTimeLimit: true,
      timeLimit: 60
    }
  }
  // a already has its only place taken, b has one left
  const submissions = [submissionOf('a')]
  const { service } = createService(submissions)
  // Seconds between the server issuing the open token and the submission
  let openedAgo = 0
  const resolver = new CompleteSubmissionResolver(
    {
      decryptToken: () => ({
        formId: form.id,
        timestamp: Math.floor(Date.now() / 1_000) - openedAgo
      }),
      // The real check, so the time limit's own submission is the one being sent
      assertOpenToken
    } as any,
    { findById: async () => structuredClone(form) } as any,
    service,
    { checkIp: async () => undefined } as any,
    { addQueue: () => undefined } as any,
    { addQueue: () => undefined } as any,
    {} as any
  )
  const submit = (answers: Record<string, any>, partialSubmission?: boolean) =>
    resolver.completeSubmission(
      { ip: '203.0.113.10', deviceId: 'device_1', lang: 'en', userAgent: {} } as any,
      'anonymous_1',
      {
        formId: form.id,
        answers,
        hiddenFields: [],
        openToken: 'encrypted-token',
        partialSubmission
      } as any
    )

  // The time ran out before the required name was answered
  openedAgo = 63

  await assert.rejects(() => submit({ [FIELD_ID]: { value: ['a'] } }, true), /"Option a" is full/)
  assert.strictEqual(submissions.length, 1)

  await submit({ [FIELD_ID]: { value: ['b'] } }, true)
  assert.strictEqual(submissions.length, 2)

  // The partial submission took the last place of b
  openedAgo = 10

  await assert.rejects(
    () => submit({ [FIELD_ID]: { value: ['b'] }, name: 'Ada' }),
    /"Option b" is full/
  )
  assert.strictEqual(submissions.length, 2)
}

async function run() {
  testCollectChoiceLimits()
  await testRejectedChoiceDoesNotUseUpTheIpLimit()
  await testPartialSubmissionsRespectAndUseTheLimits()
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
