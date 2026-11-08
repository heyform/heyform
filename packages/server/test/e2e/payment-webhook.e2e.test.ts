import assert from 'assert'
import { createHmac } from 'crypto'

import { defineSuite } from './helpers/runner'

// The secret the server verifies with, resolved the same way
const SECRET =
  process.env.STRIPE_CONNECT_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET_KEY || 'whsec_e2e'

// Stripe's scheme: HMAC-SHA256 of `${timestamp}.${raw body}`, so only the unparsed body verifies
function sign(body: string, secret = SECRET) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')

  return `t=${timestamp},v1=${signature}`
}

function event(type: string, object: Record<string, any> = {}) {
  return JSON.stringify({
    id: 'evt_e2e',
    object: 'event',
    type,
    account: 'acct_e2e',
    data: { object }
  })
}

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('payment-webhook')

  async function post(body: string, signature: string) {
    const res = await fetch(`${baseUrl}/payment/intent/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'stripe-signature': signature },
      body
    })

    return { status: res.status, text: await res.text() }
  }

  test('POST /payment/intent/webhook verifies a correctly signed event', async () => {
    // No metadata, so the handler stops after the signature check with its own error
    const body = event('payment_intent.succeeded', { id: 'pi_e2e', metadata: {} })
    const res = await post(body, sign(body))

    assert.strictEqual(res.status, 400, `body: ${res.text.slice(0, 200)}`)
    assert.match(res.text, /Invalid payment metadata/)
  })

  test('POST /payment/intent/webhook rejects a wrong signature with 400', async () => {
    const body = event('payment_intent.succeeded', { id: 'pi_e2e', metadata: {} })
    const res = await post(body, sign(body, 'whsec_wrong'))

    assert.strictEqual(res.status, 400, `body: ${res.text.slice(0, 200)}`)
    assert.match(res.text, /Invalid signature/)
  })

  test('POST /payment/intent/webhook acknowledges other signed events', async () => {
    const body = event('charge.updated')
    const res = await post(body, sign(body))

    assert.strictEqual(res.status, 201, `body: ${res.text.slice(0, 200)}`)
  })

  return suite
}
