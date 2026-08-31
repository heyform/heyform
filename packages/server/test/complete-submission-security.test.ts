import { CaptchaKindEnum, FieldKindEnum } from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { PaymentIntentWebhookController } from '../src/controller/payment-intent-webhook.controller'
import { CompleteSubmissionResolver } from '../src/resolver/endpoint/complete-submission.resolver'

async function testPaymentUsesPublishedFormConfiguration() {
  let storedSubmission: Record<string, any> | undefined
  let updatedAnswer: Record<string, any> | undefined
  let paymentIntent: Record<string, any> | undefined
  const now = Math.floor(Date.now() / 1_000)
  const form = {
    id: 'form_1',
    teamId: 'team_1',
    name: 'Payment form',
    suspended: false,
    fields: [
      {
        id: 'payment_1',
        title: 'Pay',
        kind: FieldKindEnum.PAYMENT,
        validations: { required: true },
        properties: {
          currency: 'USD',
          price: { type: 'number', value: 49.99 }
        }
      },
      {
        id: 'payment_2',
        title: 'Additional payment field',
        kind: FieldKindEnum.PAYMENT,
        validations: { required: true },
        properties: {
          currency: 'EUR',
          price: { type: 'number', value: 10 }
        }
      }
    ],
    hiddenFields: [],
    logics: [],
    variables: [],
    settings: {
      active: true,
      allowArchive: true,
      captchaKind: CaptchaKindEnum.NONE
    },
    stripeAccount: {
      accountId: 'acct_1'
    }
  }
  const endpointService = {
    decryptToken: () => ({ formId: 'form_1', timestamp: now }),
    assertOpenToken: () => now,
    verifySpam: async () => false
  }
  const submissionService = {
    createWithinQuota: async (submission: Record<string, any>) => {
      storedSubmission = submission
      return 'submission_1'
    },
    updateAnswer: async (_submissionId: string, answer: Record<string, any>) => {
      updatedAnswer = answer
      return true
    },
    countInForm: async () => 0
  }
  const paymentService = {
    createPaymentIntent: async (options: Record<string, any>) => {
      paymentIntent = options
      return 'client_secret_1'
    }
  }
  const resolver = new CompleteSubmissionResolver(
    endpointService as any,
    { findById: async () => form } as any,
    submissionService as any,
    { checkIp: async () => undefined } as any,
    { addQueue: () => undefined } as any,
    { addQueue: () => undefined } as any,
    paymentService as any
  )

  const result = await resolver.completeSubmission(
    {
      ip: '203.0.113.10',
      deviceId: 'device_1',
      lang: 'en',
      userAgent: {} as any
    },
    'anonymous_1',
    {
      formId: 'form_1',
      answers: {
        payment_1: {
          amount: 1,
          currency: 'xxx',
          billingDetails: { name: 'Respondent' }
        },
        payment_2: {
          amount: 2,
          currency: 'yyy',
          billingDetails: { name: 'Respondent' }
        }
      },
      hiddenFields: [],
      openToken: 'encrypted-token'
    }
  )

  assert.strictEqual(result.clientSecret, 'client_secret_1')
  assert.strictEqual(result.pseudonymId, undefined)
  assert.strictEqual(storedSubmission?.pseudonymId, undefined)
  assert.strictEqual(paymentIntent?.amount, 4999)
  assert.strictEqual(paymentIntent?.currency, 'usd')
  assert.strictEqual(storedSubmission?.answers[0].value.amount, 4999)
  assert.strictEqual(storedSubmission?.answers[0].value.currency, 'usd')
  assert.strictEqual(storedSubmission?.answers[1].value.amount, 1000)
  assert.strictEqual(storedSubmission?.answers[1].value.currency, 'eur')
  assert.strictEqual(storedSubmission?.answers[0].value.clientSecret, undefined)
  assert.strictEqual(updatedAnswer, undefined)
}

async function testPaymentWebhookDoesNotRequireOrPersistClientSecret() {
  let updatedAnswer: Record<string, any> | undefined
  const controller = new PaymentIntentWebhookController(
    {
      constructEvent: () => ({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_1',
            client_secret: 'client_secret_from_stripe',
            metadata: {
              submissionId: 'submission_1',
              fieldId: 'payment_1'
            },
            charges: {
              data: [
                {
                  billing_details: { name: 'Respondent' },
                  receipt_url: 'https://stripe.example/receipt'
                }
              ]
            }
          }
        }
      })
    } as any,
    {
      findById: async () => ({
        answers: [
          {
            id: 'payment_1',
            value: {
              amount: 4999,
              currency: 'usd',
              clientSecret: 'legacy_stored_secret'
            }
          }
        ]
      }),
      updateAnswer: async (_submissionId: string, answer: Record<string, any>) => {
        updatedAnswer = answer
      }
    } as any
  )

  await controller.webhook('valid_signature', { body: Buffer.from('{}') })

  assert.strictEqual(updatedAnswer?.value.clientSecret, undefined)
  assert.strictEqual(updatedAnswer?.value.paymentIntentId, 'pi_1')
  assert.strictEqual(updatedAnswer?.value.billingDetails.name, 'Respondent')
}

async function testPseudonymIdIsStoredAndReturned() {
  let storedSubmission: Record<string, any> | undefined
  const now = Math.floor(Date.now() / 1_000)
  const form = {
    id: 'form_1',
    teamId: 'team_1',
    name: 'Pseudonymized form',
    suspended: false,
    fields: [
      {
        id: 'question_1',
        title: 'Answer',
        kind: FieldKindEnum.SHORT_TEXT,
        validations: { required: true }
      }
    ],
    hiddenFields: [],
    logics: [],
    variables: [],
    settings: {
      active: true,
      allowArchive: true,
      captchaKind: CaptchaKindEnum.NONE,
      generatePseudonymId: true
    }
  }
  const resolver = new CompleteSubmissionResolver(
    {
      decryptToken: () => ({ formId: 'form_1', timestamp: now }),
      assertOpenToken: () => now
    } as any,
    { findById: async () => form } as any,
    {
      createWithPseudonymWithinQuota: async (submission: Record<string, any>) => {
        storedSubmission = submission
        return { id: 'submission_1', pseudonymId: '7KQ2-9MX4' }
      }
    } as any,
    {} as any,
    { addQueue: () => undefined } as any,
    { addQueue: () => undefined } as any,
    {} as any
  )

  const result = await resolver.completeSubmission(
    {
      ip: '203.0.113.10',
      deviceId: 'device_1',
      lang: 'en',
      userAgent: { browser: { name: 'Browser' } } as any
    },
    'anonymous_1',
    {
      formId: 'form_1',
      answers: { question_1: 'Response' },
      hiddenFields: [],
      openToken: 'encrypted-token'
    }
  )

  assert.strictEqual(result.pseudonymId, '7KQ2-9MX4')
  assert.strictEqual(storedSubmission?.ip, '203.0.113.10')
  assert.deepStrictEqual(storedSubmission?.userAgent, { browser: { name: 'Browser' } })
}

async function run() {
  await testPaymentUsesPublishedFormConfiguration()
  await testPaymentWebhookDoesNotRequireOrPersistClientSecret()
  await testPseudonymIdIsStoredAndReturned()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
