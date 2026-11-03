import { ActionEnum, CaptchaKindEnum, FieldKindEnum, Logic } from '@heyform-inc/shared-types-enums'
import assert from 'assert'

import { APP_HOMEPAGE_URL, parseTrustProxy } from '../src/environments'
import { EndpointService } from '../src/service/endpoint.service'
import { ip } from '../src/utils/decorators/ip'
import {
  OPEN_FORM_TOKEN_MAX_AGE_SECONDS,
  TIME_LIMIT_GRACE_SECONDS,
  assertFormIsAcceptingSubmissions,
  assertFormPasswordToken,
  assertOpenToken,
  isTimeLimitUp
} from '../src/utils/endpoint'
import { literalSearchRegex } from '../src/utils/search'
import {
  assertSafeSpecialFieldAnswers,
  isTrustedFileUploadAnswer,
  isTrustedSignatureUrl,
  isTrustedStripeReceiptUrl,
  resolvePaymentConfiguration,
  selectSubmissionFields
} from '../src/utils/submission'

async function testRecaptchaMustReturnStrictTrue() {
  const endpointService = new EndpointService()
  endpointService.verifyRecaptcha = async () => false

  await assert.rejects(
    () =>
      endpointService.antiBotCheck(CaptchaKindEnum.GOOGLE_RECAPTCHA, {
        recaptchaToken: 'failed-token'
      }),
    (error: any) => error?.message === 'Failed to pass the bot-detection check'
  )

  endpointService.verifyRecaptcha = async () => true
  await endpointService.antiBotCheck(CaptchaKindEnum.GOOGLE_RECAPTCHA, {
    recaptchaToken: 'valid-token'
  })
}

function testFormAvailabilityAndOpenTokenExpiry() {
  assert.throws(
    () =>
      assertFormIsAcceptingSubmissions(
        {
          enableExpirationDate: true,
          enabledAt: 101
        },
        100
      ),
    /not accepting submissions/
  )
  assert.throws(
    () =>
      assertFormIsAcceptingSubmissions(
        {
          enableExpirationDate: true,
          closedAt: 99
        },
        100
      ),
    /not accepting submissions/
  )

  assert.strictEqual(assertOpenToken({ formId: 'form_1', timestamp: 90 }, 'form_1', {}, 100), 90)
  assert.throws(
    () =>
      assertOpenToken(
        { formId: 'form_1', timestamp: 100 - OPEN_FORM_TOKEN_MAX_AGE_SECONDS - 1 },
        'form_1',
        {},
        100
      ),
    /Invalid form token/
  )
  assert.throws(
    () =>
      assertOpenToken(
        { formId: 'form_1', timestamp: 90 },
        'form_1',
        { enableTimeLimit: true, timeLimit: 5 },
        100
      ),
    /time limit has expired/
  )
}

function testFormPasswordTokensAreBoundAndExpire() {
  const token = {
    anonymousId: 'anonymous_1',
    formId: 'form_1',
    passwordHash: '$2b$10$current-hash',
    timestamp: 100
  }

  assert.doesNotThrow(() =>
    assertFormPasswordToken(token, 'form_1', 'anonymous_1', '$2b$10$current-hash', 110)
  )
  assert.throws(
    () => assertFormPasswordToken(token, 'form_2', 'anonymous_1', token.passwordHash, 110),
    /Invalid form password token/
  )
  assert.throws(
    () => assertFormPasswordToken(token, 'form_1', 'anonymous_2', token.passwordHash, 110),
    /Invalid form password token/
  )
  assert.throws(
    () => assertFormPasswordToken(token, 'form_1', 'anonymous_1', 'changed-hash', 110),
    /Invalid form password token/
  )
  assert.throws(
    () => assertFormPasswordToken(token, 'form_1', 'anonymous_1', token.passwordHash, 86_501),
    /Invalid form password token/
  )
}

function testPartialSubmissionsAreSelectedFromServerLogic() {
  const fields = [
    { id: 'first', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'branch', kind: FieldKindEnum.SHORT_TEXT, isTouched: false },
    { id: 'required_later', kind: FieldKindEnum.SHORT_TEXT }
  ]
  const logics: Logic[] = [
    {
      fieldId: 'branch',
      payloads: [
        {
          id: 'payload_1',
          condition: {} as any,
          action: { kind: ActionEnum.NAVIGATE, fieldId: 'required_later' }
        }
      ]
    }
  ]

  assert.deepStrictEqual(
    selectSubmissionFields(fields as any, logics, true).map(field => field.id),
    ['first', 'branch']
  )
  assert.throws(() => selectSubmissionFields(fields as any, [], true), /Invalid partial submission/)
  // Only the time limit's own submission may stop without an unresolved jump field
  assert.deepStrictEqual(
    selectSubmissionFields(fields as any, [], true, true).map(field => field.id),
    ['first', 'branch', 'required_later']
  )
}

// The countdown starts after the open token is issued, so its submission arrives late; only a
// partial submission gets the grace window, and only for so long.
function testTimeLimitSubmissionsGetAGraceWindow() {
  const settings = { enableTimeLimit: true, timeLimit: 60 }
  const token = { formId: 'form_1', timestamp: 1_000 }

  assert.strictEqual(isTimeLimitUp(settings, 1_000, 1_059), false)
  assert.strictEqual(isTimeLimitUp(settings, 1_000, 1_060), true)
  assert.strictEqual(isTimeLimitUp({}, 1_000, 9_999), false)
  assert.strictEqual(isTimeLimitUp({ enableTimeLimit: true, timeLimit: 0 }, 1_000, 9_999), false)

  assert.strictEqual(
    assertOpenToken(token, 'form_1', settings, 1_061, { allowTimeUpGrace: true }),
    1_000
  )
  assert.strictEqual(
    assertOpenToken(token, 'form_1', settings, 1_060 + TIME_LIMIT_GRACE_SECONDS, {
      allowTimeUpGrace: true
    }),
    1_000
  )
  assert.throws(
    () =>
      assertOpenToken(token, 'form_1', settings, 1_061 + TIME_LIMIT_GRACE_SECONDS, {
        allowTimeUpGrace: true
      }),
    /time limit has expired/
  )
  assert.throws(() => assertOpenToken(token, 'form_1', settings, 1_061), /time limit has expired/)
}

function testPaymentConfigurationIsServerControlled() {
  assert.deepStrictEqual(
    resolvePaymentConfiguration(
      {
        currency: 'USD',
        price: { type: 'number', value: 12.34 }
      },
      {}
    ),
    { amount: 1234, currency: 'usd' }
  )
  assert.deepStrictEqual(
    resolvePaymentConfiguration(
      {
        currency: 'EUR',
        price: { type: 'variable', ref: 'total' }
      },
      { total: 9.5 }
    ),
    { amount: 950, currency: 'eur' }
  )
  assert.throws(
    () =>
      resolvePaymentConfiguration({ currency: 'USD', price: { type: 'number', value: -1 } }, {}),
    /Invalid payment amount/
  )
}

function testSpecialFieldValuesFailClosedOnTheServer() {
  const fields = [
    { id: 'terms', kind: FieldKindEnum.LEGAL_TERMS, validations: { required: true } },
    { id: 'table', kind: FieldKindEnum.INPUT_TABLE },
    { id: 'signature', kind: FieldKindEnum.SIGNATURE },
    { id: 'file', kind: FieldKindEnum.FILE_UPLOAD },
    { id: 'payment', kind: FieldKindEnum.PAYMENT }
  ] as any

  assert.throws(
    () =>
      assertSafeSpecialFieldAnswers(fields, {
        terms: true,
        table: 'not an array',
        signature: 'https://cdn.example.com/signature.png',
        file: `${APP_HOMEPAGE_URL}/static/upload/file-id`,
        payment: { amount: 100, currency: 'usd' }
      }),
    /Invalid field value/
  )
  assert.throws(
    () =>
      assertSafeSpecialFieldAnswers(fields, {
        terms: false,
        table: [],
        signature: 'https://cdn.example.com/signature.png',
        file: `${APP_HOMEPAGE_URL}/static/upload/file-id`,
        payment: { amount: 100, currency: 'usd' }
      }),
    /Invalid field value/
  )
  assert.doesNotThrow(() =>
    assertSafeSpecialFieldAnswers(fields, {
      terms: true,
      table: [{ column_1: 'value' }],
      signature: `${APP_HOMEPAGE_URL}/upload/form_1/signature.png`,
      file: {
        filename: 'report.pdf',
        url: `${APP_HOMEPAGE_URL}/static/upload/file-id`
      },
      payment: {
        amount: 100,
        currency: 'usd',
        paymentIntentId: 'pi_123',
        receiptUrl: 'https://pay.stripe.com/receipts/payment/abc'
      }
    })
  )

  assert.throws(
    () =>
      assertSafeSpecialFieldAnswers([{ id: 'signature', kind: FieldKindEnum.SIGNATURE }] as any, {
        signature: 'http://192.0.2.1:9999/tracker.gif?evil=1'
      }),
    /Invalid field value/
  )
  assert.doesNotThrow(() =>
    assertSafeSpecialFieldAnswers([{ id: 'signature', kind: FieldKindEnum.SIGNATURE }] as any, {
      signature: 'data:image/png;base64,c2lnbmF0dXJl'
    })
  )

  const s3Origins = ['https://uploads.example.com/storage']

  assert.strictEqual(
    isTrustedSignatureUrl('https://uploads.example.com/signatures/sig.png', s3Origins),
    true
  )
  assert.strictEqual(
    isTrustedSignatureUrl(
      'https://uploads.example.com.attacker.test/signatures/sig.png',
      s3Origins
    ),
    false
  )
  assert.strictEqual(
    isTrustedSignatureUrl('http://uploads.example.com/signatures/sig.png', s3Origins),
    false
  )

  assert.strictEqual(
    isTrustedFileUploadAnswer(
      { filename: 'report.pdf', url: 'https://uploads.example.com/files/file-id' },
      s3Origins
    ),
    true
  )
  assert.strictEqual(
    isTrustedFileUploadAnswer(
      {
        filename: 'report.pdf',
        urlPrefix: 'https://uploads.example.com/files',
        key: 'file-id'
      },
      s3Origins
    ),
    true
  )
  assert.strictEqual(
    isTrustedFileUploadAnswer(
      { filename: 'Signed_Contract.pdf', url: 'https://attacker.example/phish' },
      s3Origins
    ),
    false
  )
  assert.strictEqual(
    isTrustedFileUploadAnswer(
      { filename: 'report.pdf', url: 'https://uploads.example.com.attacker.test/file-id' },
      s3Origins
    ),
    false
  )

  assert.strictEqual(isTrustedStripeReceiptUrl(undefined), true)
  assert.strictEqual(isTrustedStripeReceiptUrl('https://pay.stripe.com/receipts/payment/abc'), true)
  assert.strictEqual(isTrustedStripeReceiptUrl('javascript:alert(document.domain)'), false)
  assert.strictEqual(isTrustedStripeReceiptUrl('http://pay.stripe.com/receipts/payment/abc'), false)
  assert.strictEqual(
    isTrustedStripeReceiptUrl('https://pay.stripe.com.attacker.test/receipts/payment/abc'),
    false
  )
}

function testSearchIsLiteralAndIpUsesExpressTrustPolicy() {
  const regex = literalSearchRegex('form.*(secret)')

  assert.strictEqual(regex.test('FORM.*(SECRET)'), true)
  assert.strictEqual(regex.test('form anything secret'), false)

  const req = {
    ip: '203.0.113.10',
    get: () => '127.0.0.1'
  }
  assert.strictEqual(ip(req), '203.0.113.10')
}

function testTrustProxyFailsClosedByDefault() {
  assert.strictEqual(parseTrustProxy(undefined), false)
  assert.strictEqual(parseTrustProxy('false'), false)
  assert.strictEqual(parseTrustProxy('1'), 1)
  assert.strictEqual(parseTrustProxy('loopback, 10.0.0.0/8'), 'loopback, 10.0.0.0/8')
}

async function run() {
  await testRecaptchaMustReturnStrictTrue()
  testFormAvailabilityAndOpenTokenExpiry()
  testFormPasswordTokensAreBoundAndExpire()
  testPartialSubmissionsAreSelectedFromServerLogic()
  testTimeLimitSubmissionsGetAGraceWindow()
  testPaymentConfigurationIsServerControlled()
  testSpecialFieldValuesFailClosedOnTheServer()
  testSearchIsLiteralAndIpUsesExpressTrustPolicy()
  testTrustProxyFailsClosedByDefault()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
