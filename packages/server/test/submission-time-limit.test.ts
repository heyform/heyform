import {
  ActionEnum,
  CaptchaKindEnum,
  ComparisonEnum,
  FieldKindEnum
} from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { CompleteSubmissionResolver } from '../src/resolver/endpoint/complete-submission.resolver'
import { TIME_LIMIT_GRACE_SECONDS, assertOpenToken } from '../src/utils/endpoint'

// A timed form: q1 is required, q2 is optional and has to be a number, q3 is required
const form = {
  id: 'form_1',
  teamId: 'team_1',
  name: 'Timed quiz',
  suspended: false,
  fields: [
    { id: 'q1', title: 'Q1', kind: FieldKindEnum.SHORT_TEXT, validations: { required: true } },
    { id: 'q2', title: 'Q2', kind: FieldKindEnum.NUMBER, validations: {} },
    { id: 'q3', title: 'Q3', kind: FieldKindEnum.SHORT_TEXT, validations: { required: true } },
    { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU }
  ],
  hiddenFields: [],
  logics: [] as any[],
  variables: [],
  settings: {
    active: true,
    allowArchive: true,
    captchaKind: CaptchaKindEnum.NONE,
    enableTimeLimit: true,
    timeLimit: 60
  }
}

// openedAgo: seconds between the server issuing the open token and the submission
function setup(openedAgo: number, formOverride: Record<string, any> = form) {
  const stored: any[] = []
  const now = Math.floor(Date.now() / 1_000)
  const resolver = new CompleteSubmissionResolver(
    {
      decryptToken: () => ({ formId: 'form_1', timestamp: now - openedAgo }),
      // The real check, so the grace window is what is tested
      assertOpenToken,
      verifySpam: async () => false
    } as any,
    { findById: async () => structuredClone(formOverride) } as any,
    {
      createWithinQuota: async (submission: any) => {
        stored.push(submission)
        return 'submission_1'
      },
      updateAnswer: async () => true
    } as any,
    { checkIp: async () => undefined } as any,
    { addQueue: () => undefined } as any,
    { addQueue: () => undefined } as any,
    { createPaymentIntent: async () => ({ id: 'pi_1', clientSecret: 'client_secret_1' }) } as any
  )

  return {
    stored,
    submit: (answers: Record<string, any>, partialSubmission?: boolean) =>
      resolver.completeSubmission(
        { ip: '203.0.113.10', deviceId: 'device_1', lang: 'en', userAgent: {} } as any,
        'anonymous_1',
        {
          formId: 'form_1',
          answers,
          hiddenFields: [],
          openToken: 'token',
          partialSubmission
        } as any
      )
  }
}

async function rejects(promise: Promise<unknown>, message: RegExp) {
  await assert.rejects(promise, (err: any) =>
    message.test(JSON.stringify(err.response ?? err.message))
  )
}

async function testTimeUpStoresWhatWasAnswered() {
  // The countdown fires a few seconds after openedAt + timeLimit
  const { stored, submit } = setup(63)

  await submit({ q1: 'an answer', q2: 'not a number' }, true)

  assert.strictEqual(stored.length, 1)
  assert.deepStrictEqual(
    stored[0].answers.map((answer: any) => [answer.id, answer.value]),
    [['q1', 'an answer']]
  )
}

async function testTimeUpStillHonoursADiscardingRoute() {
  const { stored, submit } = setup(63, {
    ...form,
    fields: [
      ...form.fields,
      {
        id: 'not_eligible',
        title: 'Not eligible',
        kind: FieldKindEnum.THANK_YOU,
        properties: { discardSubmission: true }
      }
    ],
    logics: [
      {
        fieldId: 'q1',
        payloads: [
          {
            id: 'p1',
            condition: { comparison: ComparisonEnum.IS, expected: 'no' },
            action: { kind: ActionEnum.NAVIGATE, fieldId: 'not_eligible' }
          }
        ]
      }
    ]
  })

  assert.deepStrictEqual(await submit({ q1: 'no' }, true), {})
  assert.strictEqual(stored.length, 0)
}

async function testOnlyTheTimeLimitMaySkipRequiredQuestions() {
  // Before the time is up a partial submission still needs an unresolved jump field
  await rejects(setup(30).submit({ q1: 'an answer' }, true), /Invalid partial submission/)
  // A complete submission after the limit gets no grace
  await rejects(setup(61).submit({ q1: 'a', q3: 'b' }), /time limit has expired/)
  // Nor does the time limit's own submission once the grace window has passed
  await rejects(
    setup(61 + TIME_LIMIT_GRACE_SECONDS).submit({ q1: 'an answer' }, true),
    /time limit has expired/
  )
  // A complete submission in time is validated as before
  await rejects(setup(30).submit({ q1: 'a' }), /This field is required/)

  const { stored, submit } = setup(30)
  await submit({ q1: 'a', q3: 'b' })
  assert.strictEqual(stored.length, 1)
}

async function main() {
  await testTimeUpStoresWhatWasAnswered()
  await testTimeUpStillHonoursADiscardingRoute()
  await testOnlyTheTimeLimitMaySkipRequiredQuestions()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
