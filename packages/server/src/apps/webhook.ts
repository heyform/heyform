import got from 'got'

import type { FormModel, SubmissionModel } from '@model'
import { assertSafeOutboundRequest, assertSafeOutboundUrl, isSubmissionIpVisible } from '@utils'

import { defineApp } from './types'

export const WEBHOOK_MAX_RESPONSE_BYTES = 64 * 1024

interface WebhookResponseStream extends AsyncIterable<Buffer | string> {
  destroy(error?: Error): void
}

export async function readLimitedWebhookResponse(
  response: WebhookResponseStream,
  maxBytes = WEBHOOK_MAX_RESPONSE_BYTES
): Promise<string> {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of response) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length

    if (totalBytes > maxBytes) {
      response.destroy()
      throw new Error(`Webhook response exceeds the ${maxBytes} byte limit`)
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks, totalBytes).toString('utf8')
}

// The JSON body posted for each submission
export function webhookPayload(submission: SubmissionModel, form: FormModel) {
  return {
    id: submission.id,
    formId: form.id,
    formName: form.name,
    fields: form.fields,
    answers: submission.answers,
    hiddenFields: submission.hiddenFields,
    variables: submission.variables,
    ...(isSubmissionIpVisible(form as any) && { ip: submission.ip })
  }
}

export default defineApp({
  id: 'webhook',
  name: 'Webhook',
  description:
    "With webhooks integration, you can send every submission straight to any URL as soon as it's submitted.",
  icon: '/static/webhook.png',
  settings: [
    {
      type: 'url',
      name: 'endpointUrl',
      label: 'Endpoint URL',
      placeholder: 'https://webhook.example.com',
      required: true
    }
  ],
  validate: async config => {
    // Reject private and loopback endpoints when the integration is saved;
    // run() checks again because DNS can change between save and delivery
    await assertSafeOutboundUrl(config.endpointUrl)
  },
  run: async ({ config, submission, form }) => {
    const { lookup, url: endpointUrl } = await assertSafeOutboundRequest(config.endpointUrl)

    const response = got.stream.post(endpointUrl.toString(), {
      followRedirect: false,
      lookup,
      retry: 0,
      timeout: {
        connect: 5_000,
        secureConnect: 5_000,
        send: 5_000,
        response: 10_000,
        socket: 10_000,
        request: 15_000
      },
      json: webhookPayload(submission, form)
    })

    return readLimitedWebhookResponse(response)
  }
})
