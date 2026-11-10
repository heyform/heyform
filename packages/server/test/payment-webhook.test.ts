import { BadRequestException } from '@nestjs/common'
import assert from 'assert'

import { PaymentIntentWebhookController } from '../src/controller/payment-intent-webhook.controller'

interface Options {
  event?: Record<string, any>
  answerValue?: Record<string, any>
  constructEvent?: () => any
  submission?: Record<string, any> | null
  formAccountId?: string
}

// The PaymentIntent object as API versions from 2022-11-15 send it: no `charges`, only the
// latest charge's id
function succeededEvent(paymentIntentId = 'pi_1') {
  return {
    type: 'payment_intent.succeeded',
    account: 'acct_owner',
    data: {
      object: {
        id: paymentIntentId,
        amount: 4999,
        currency: 'usd',
        latest_charge: 'ch_1',
        metadata: { submissionId: 'submission_1', fieldId: 'payment_1' }
      }
    }
  }
}

function setup({
  event = succeededEvent(),
  answerValue,
  constructEvent,
  submission,
  formAccountId = 'acct_owner'
}: Options = {}) {
  const updates: Record<string, any>[] = []
  const chargeLookups: string[][] = []
  const controller = new PaymentIntentWebhookController(
    {
      constructEvent: constructEvent ?? (() => event),
      retrieveCharge: async (chargeId: string, stripeAccountId: string) => {
        chargeLookups.push([chargeId, stripeAccountId])
        return {
          billing_details: { name: 'Respondent' },
          receipt_url: 'https://pay.stripe.com/receipts/1'
        }
      }
    } as any,
    {
      findById: async () =>
        submission === null
          ? null
          : {
              formId: 'form_1',
              answers: [
                {
                  id: 'payment_1',
                  value: answerValue ?? {
                    amount: 4999,
                    currency: 'usd',
                    billingDetails: { name: 'Typed name' },
                    pendingPaymentIntentId: 'pi_1'
                  }
                }
              ]
            },
      updateAnswer: async (_submissionId: string, answer: Record<string, any>) => {
        updates.push(answer)
        return true
      }
    } as any,
    {
      findById: async () => ({ stripeAccount: { accountId: formAccountId } })
    } as any
  )

  return {
    updates,
    chargeLookups,
    send: () => controller.webhook('signature', { body: Buffer.from('{}') })
  }
}

async function testRecordsPaymentFromLatestCharge() {
  const { updates, chargeLookups, send } = setup()

  await send()

  // The charge lives on the form owner's connected account, which the event names
  assert.deepStrictEqual(chargeLookups, [['ch_1', 'acct_owner']])
  assert.strictEqual(updates.length, 1)
  assert.strictEqual(updates[0].value.paymentIntentId, 'pi_1')
  assert.strictEqual(updates[0].value.pendingPaymentIntentId, undefined)
  assert.strictEqual(updates[0].value.billingDetails.name, 'Respondent')
  assert.strictEqual(updates[0].value.receiptUrl, 'https://pay.stripe.com/receipts/1')
  assert.strictEqual(updates[0].value.amount, 4999)
}

// A non-2xx makes Stripe retry for days, so an event that can never apply is acknowledged instead
async function testIgnoresPaymentIntentNotCreatedForAnswer() {
  const { updates, chargeLookups, send } = setup({ event: succeededEvent('pi_other') })

  assert.strictEqual(await send(), 'success')
  assert.strictEqual(updates.length, 0)
  assert.deepStrictEqual(chargeLookups, [])
}

// Answers submitted before the deploy name no intent, so they're matched by account and amount
async function testRecordsLegacyAnswerPaidOnTheFormOwnersAccount() {
  const { updates, send } = setup({ answerValue: { amount: 4999, currency: 'USD' } })

  await send()

  assert.strictEqual(updates.length, 1)
  assert.strictEqual(updates[0].value.paymentIntentId, 'pi_1')
}

async function testIgnoresLegacyAnswerPaidOnAnotherAccount() {
  const { updates, send } = setup({
    answerValue: { amount: 4999, currency: 'usd' },
    formAccountId: 'acct_other'
  })

  assert.strictEqual(await send(), 'success')
  assert.strictEqual(updates.length, 0)
}

async function testIgnoresLegacyAnswerPaidADifferentAmount() {
  const { updates, send } = setup({ answerValue: { amount: 100, currency: 'usd' } })

  assert.strictEqual(await send(), 'success')
  assert.strictEqual(updates.length, 0)
}

async function testIgnoresEventWithoutSubmissionMetadata() {
  const { updates, send } = setup({
    event: { type: 'payment_intent.succeeded', data: { object: { id: 'pi_1', metadata: {} } } }
  })

  assert.strictEqual(await send(), 'success')
  assert.strictEqual(updates.length, 0)
}

async function testIgnoresEventForAMissingSubmission() {
  const { updates, send } = setup({
    event: succeededEvent(),
    submission: null
  })

  assert.strictEqual(await send(), 'success')
  assert.strictEqual(updates.length, 0)
}

async function testRepeatedEventSucceedsWithoutUpdating() {
  const { updates, send } = setup({
    answerValue: { amount: 4999, currency: 'usd', paymentIntentId: 'pi_1' }
  })

  assert.strictEqual(await send(), 'success')
  assert.strictEqual(updates.length, 0)
}

async function testInvalidSignatureIsBadRequest() {
  const { updates, send } = setup({
    constructEvent: () => {
      throw new Error('No signatures found matching the expected signature for payload')
    }
  })

  await assert.rejects(send, (error: any) => {
    assert.ok(error instanceof BadRequestException)
    assert.strictEqual(error.message, 'Invalid signature')
    return true
  })
  assert.strictEqual(updates.length, 0)
}

async function testIgnoresOtherEvents() {
  const { updates, send } = setup({ event: { type: 'charge.updated', data: { object: {} } } })

  assert.strictEqual(await send(), 'success')
  assert.strictEqual(updates.length, 0)
}

async function run() {
  await testRecordsPaymentFromLatestCharge()
  await testIgnoresPaymentIntentNotCreatedForAnswer()
  await testRecordsLegacyAnswerPaidOnTheFormOwnersAccount()
  await testIgnoresLegacyAnswerPaidOnAnotherAccount()
  await testIgnoresLegacyAnswerPaidADifferentAmount()
  await testIgnoresEventWithoutSubmissionMetadata()
  await testIgnoresEventForAMissingSubmission()
  await testRepeatedEventSucceedsWithoutUpdating()
  await testInvalidSignatureIsBadRequest()
  await testIgnoresOtherEvents()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
