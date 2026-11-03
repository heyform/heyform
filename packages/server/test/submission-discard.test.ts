import {
  ActionEnum,
  CaptchaKindEnum,
  ComparisonEnum,
  FieldKindEnum
} from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { CompleteSubmissionResolver } from '../src/resolver/endpoint/complete-submission.resolver'

const now = Math.floor(Date.now() / 1_000)

const form = {
  id: 'form_1',
  teamId: 'team_1',
  name: 'Eligibility',
  suspended: false,
  fields: [
    { id: 'q1', title: 'Eligible?', kind: FieldKindEnum.SHORT_TEXT, validations: {} },
    {
      id: 'pay',
      title: 'Pay',
      kind: FieldKindEnum.PAYMENT,
      validations: {},
      properties: { currency: 'USD', price: { type: 'number', value: 10 } }
    },
    { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU },
    {
      id: 'not_eligible',
      title: 'Try again later',
      kind: FieldKindEnum.THANK_YOU,
      properties: { discardSubmission: true }
    }
  ],
  hiddenFields: [],
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
  ],
  variables: [],
  settings: { active: true, allowArchive: true, captchaKind: CaptchaKindEnum.NONE },
  stripeAccount: { accountId: 'acct_1' }
}

function setup(formOverride: Record<string, any> = form) {
  const calls = { spam: 0, create: 0, payment: 0, report: 0, integration: 0 }
  const resolver = new CompleteSubmissionResolver(
    {
      decryptToken: () => ({ formId: 'form_1', timestamp: now }),
      assertOpenToken: () => now,
      verifySpam: async () => {
        calls.spam++
        return false
      }
    } as any,
    // Logic marks the fields it visits, so each lookup gets its own copy like a real read
    { findById: async () => structuredClone(formOverride) } as any,
    {
      createWithinQuota: async () => {
        calls.create++
        return 'submission_1'
      }
    } as any,
    { checkIp: async () => undefined } as any,
    { addQueue: () => calls.report++ } as any,
    { addQueue: () => calls.integration++ } as any,
    {
      createPaymentIntent: async () => {
        calls.payment++
        return 'client_secret_1'
      }
    } as any
  )

  return {
    calls,
    submit: (answers: Record<string, any>, partialSubmission?: boolean) =>
      resolver.completeSubmission(
        { ip: '203.0.113.10', deviceId: 'device_1', lang: 'en', userAgent: {} } as any,
        'anonymous_1',
        {
          formId: 'form_1',
          answers,
          hiddenFields: [],
          openToken: 'encrypted-token',
          partialSubmission
        } as any
      )
  }
}

async function testDiscardingEndingStoresAndSendsNothing() {
  const { calls, submit } = setup()

  assert.deepStrictEqual(await submit({ q1: 'no' }), {})
  assert.deepStrictEqual(calls, { spam: 0, create: 0, payment: 0, report: 0, integration: 0 })
}

async function testOtherRoutesAreStillSaved() {
  const { calls, submit } = setup()

  await submit({
    q1: 'yes',
    pay: { amount: 1, currency: 'xxx', billingDetails: { name: 'Respondent' } }
  })

  assert.strictEqual(calls.create, 1)
  assert.strictEqual(calls.payment, 1)
  assert.strictEqual(calls.report, 1)
  assert.strictEqual(calls.integration, 1)
}

async function testInvalidAnswersAreStillRejected() {
  const { calls, submit } = setup({
    ...form,
    fields: [
      { ...form.fields[0], validations: { required: true } },
      {
        id: 'email',
        title: 'Email',
        kind: FieldKindEnum.EMAIL,
        validations: {}
      },
      form.fields[3]
    ],
    logics: []
  })

  await assert.rejects(submit({ q1: 'no', email: 'not an email' }))
  assert.strictEqual(calls.create, 0)
}

async function testFormsWithoutLogicOrVariablesAreSaved() {
  const { calls, submit } = setup({
    ...form,
    fields: [form.fields[0], form.fields[2]],
    logics: null,
    variables: null
  })

  await submit({ q1: 'no' })

  assert.strictEqual(calls.create, 1)
}

async function testPartialSubmissionFallingThroughToDiscardingEnding() {
  const { calls, submit } = setup({
    ...form,
    fields: [form.fields[0], form.fields[3], form.fields[2]],
    logics: [
      {
        fieldId: 'q1',
        payloads: [
          {
            id: 'p1',
            condition: { comparison: ComparisonEnum.IS, expected: 'yes' },
            action: { kind: ActionEnum.NAVIGATE, fieldId: 'end' }
          }
        ]
      }
    ]
  })

  assert.deepStrictEqual(await submit({}, true), {})
  assert.strictEqual(calls.create, 0)
}

// The renderer may hide the payment field, Stripe account or not, so q1 falls through to the
// first ending and the respondent sees it as saved. Disagreeing routes must keep the response.
async function testPaymentRouteThatChangesTheEndingIsSaved() {
  for (const stripeAccount of [undefined, form.stripeAccount]) {
    const { calls, submit } = setup({
      ...form,
      stripeAccount,
      fields: [
        { ...form.fields[0], nextFieldId: 'pay' },
        { ...form.fields[1], nextFieldId: 'not_eligible' },
        form.fields[2],
        form.fields[3]
      ],
      logics: []
    })

    await submit({ q1: 'yes' })

    assert.strictEqual(calls.create, 1)
  }
}

// Both routes agree here: the jump to the discarding ending comes before the payment field.
async function testPaymentFieldLaterInTheFormStillDiscards() {
  const { calls, submit } = setup({ ...form, stripeAccount: undefined })

  assert.deepStrictEqual(await submit({ q1: 'no' }), {})
  assert.strictEqual(calls.create, 0)
}

// The browser swaps an upload for its URL before sending, so a rule reading it can resolve
// differently here than on screen. The server must keep the response rather than guess.
async function testFormsWithVariableRulesAreLeftToTheRenderer() {
  const { calls, submit } = setup({
    ...form,
    variables: [
      {
        id: 'v',
        kind: 'string',
        value: '',
        logics: [
          {
            condition: { comparison: ComparisonEnum.STARTS_WITH, expected: 'http' },
            action: { kind: ActionEnum.NAVIGATE, fieldId: 'not_eligible' }
          }
        ]
      }
    ]
  })

  await submit({ q1: 'no' })

  assert.strictEqual(calls.create, 1)
}

// The renderer drops a group with no questions, so q1's destination falls through to q2 and
// its ending. The server must not follow the empty group on to the next field in stored order.
async function testEmptyGroupsAreLeftOffTheRoute() {
  const { calls, submit } = setup({
    ...form,
    fields: [
      { ...form.fields[0], nextFieldId: 'empty' },
      {
        id: 'q2',
        title: 'Q2',
        kind: FieldKindEnum.SHORT_TEXT,
        validations: {},
        nextFieldId: 'end'
      },
      { id: 'empty', title: 'Empty', kind: FieldKindEnum.GROUP, properties: { fields: [] } },
      form.fields[3],
      form.fields[2]
    ],
    logics: []
  })

  await submit({ q1: 'yes', q2: 'yes' })

  assert.strictEqual(calls.create, 1)
}

async function main() {
  await testDiscardingEndingStoresAndSendsNothing()
  await testOtherRoutesAreStillSaved()
  await testInvalidAnswersAreStillRejected()
  await testFormsWithoutLogicOrVariablesAreSaved()
  await testPartialSubmissionFallingThroughToDiscardingEnding()
  await testPaymentRouteThatChangesTheEndingIsSaved()
  await testPaymentFieldLaterInTheFormStillDiscards()
  await testFormsWithVariableRulesAreLeftToTheRenderer()
  await testEmptyGroupsAreLeftOffTheRoute()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
