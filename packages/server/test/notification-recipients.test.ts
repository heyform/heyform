import * as assert from 'assert'

import { UpdateFormResolver } from '../src/resolver/form/update-form.resolver'
import {
  MAX_NOTIFICATION_RECIPIENTS,
  normalizeNotificationRecipients,
  readNotificationRecipients
} from '../src/utils/notification-recipients'

import { SubmissionNotificationQueue } from '../src/queue/submission-notification.queue'

// --- validation -------------------------------------------------------------

function testNormalizeTrimsLowercasesAndDedupes() {
  assert.deepStrictEqual(
    normalizeNotificationRecipients(['  Info@Client.COM ', 'info@client.com', 'ops@client.com']),
    ['info@client.com', 'ops@client.com']
  )
}

function testNormalizeTreatsNullAndUndefinedAsEmpty() {
  assert.deepStrictEqual(normalizeNotificationRecipients(null), [])
  assert.deepStrictEqual(normalizeNotificationRecipients(undefined), [])
  assert.deepStrictEqual(normalizeNotificationRecipients([]), [])
}

function testNormalizeRejectsInvalidEmails() {
  for (const bad of ['not-an-email', 'a@b', '', 'x@y.com\r\nBcc: z@y.com', 42, null]) {
    assert.throws(
      () => normalizeNotificationRecipients(['ok@client.com', bad]),
      /Invalid notification recipient/,
      `expected ${JSON.stringify(bad)} to be rejected`
    )
  }
}

function testNormalizeRejectsNonArray() {
  assert.throws(() => normalizeNotificationRecipients('a@b.com'), /must be a list/)
}

function testNormalizeEnforcesMaximumAfterDedupe() {
  const make = (count: number) => Array.from({ length: count }, (_, i) => `user${i}@client.com`)

  assert.strictEqual(
    normalizeNotificationRecipients(make(MAX_NOTIFICATION_RECIPIENTS)).length,
    MAX_NOTIFICATION_RECIPIENTS
  )
  assert.throws(
    () => normalizeNotificationRecipients(make(MAX_NOTIFICATION_RECIPIENTS + 1)),
    /at most 10/
  )
  // Duplicates do not count towards the limit
  assert.strictEqual(
    normalizeNotificationRecipients([...make(MAX_NOTIFICATION_RECIPIENTS), 'USER0@client.com'])
      .length,
    MAX_NOTIFICATION_RECIPIENTS
  )
}

function testReadIsLenient() {
  assert.deepStrictEqual(readNotificationRecipients(undefined), [])
  assert.deepStrictEqual(readNotificationRecipients('nope'), [])
  assert.deepStrictEqual(readNotificationRecipients(['A@b.co', 'bad', 7, 'a@b.co']), ['a@b.co'])
}

// --- updateForm resolver ----------------------------------------------------

async function runUpdate(input: Record<string, any>) {
  let updates: Record<string, any> | undefined
  const formService = {
    update: async (_formId: string, payload: Record<string, any>) => {
      updates = payload
      return true
    },
    addTranslateQueue: async () => undefined
  }
  const resolver = new UpdateFormResolver(formService as any)

  await resolver.updateForm(
    { settings: {} } as any,
    { id: 'user_1' } as any,
    {
      formId: 'form_1',
      ...input
    } as any
  )

  return updates!
}

async function testUpdatePersistsNormalizedRecipients() {
  const updates = await runUpdate({ notificationRecipients: [' A@Client.com', 'a@client.com'] })
  assert.deepStrictEqual(updates['settings.notificationRecipients'], ['a@client.com'])
}

async function testUpdateEmptyListClearsRecipients() {
  assert.deepStrictEqual(
    (await runUpdate({ notificationRecipients: [] }))['settings.notificationRecipients'],
    []
  )
  assert.deepStrictEqual(
    (await runUpdate({ notificationRecipients: null }))['settings.notificationRecipients'],
    []
  )
}

async function testUpdateOmittedRecipientsLeavesSettingUntouched() {
  const updates = await runUpdate({ name: 'Renamed' })
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(updates, 'settings.notificationRecipients'),
    false
  )
}

async function testUpdateRejectsInvalidRecipients() {
  await assert.rejects(runUpdate({ notificationRecipients: ['nope'] }), /Invalid notification/)
}

// --- queue ------------------------------------------------------------------

interface SentMail {
  to: string
  locale?: string
}

function createQueue(
  settings: Record<string, any> | undefined,
  options: { failFor?: string[] } = {}
) {
  const sent: SentMail[] = []
  const attempted: string[] = []
  const logs: string[] = []

  const queue = new SubmissionNotificationQueue(
    { findById: async () => ({ answers: [] }) } as any,
    {
      submissionNotification: async (to: string, _options: unknown, locale?: string) => {
        attempted.push(to)

        if (options.failFor?.includes(to)) {
          throw new Error('enqueue failed')
        }

        sent.push({ to, locale })
      }
    } as any,
    {
      findById: async () => ({
        id: 'form_1',
        name: 'Contact',
        teamId: 'team_1',
        projectId: 'project_1',
        memberId: 'user_1',
        settings
      })
    } as any,
    { findById: async () => ({ email: 'Owner@Agency.com', lang: 'en' }) } as any
  )
  queue.logger = { error: (message: string) => logs.push(message) } as any

  // Mirrors Bull: `update` replaces the job data and persists it for later attempts
  const job = {
    id: 'job_1',
    queue: { name: 'SubmissionNotificationQueue' },
    data: { formId: 'form_1', submissionId: 'submission_1', integrationId: '' } as Record<
      string,
      any
    >,
    update: async (data: Record<string, any>) => {
      job.data = data
    }
  }

  return { run: () => queue.process(job as any), sent, attempted, logs, job }
}

async function testQueueWithoutRecipientsOnlyNotifiesOwner() {
  for (const settings of [undefined, {}, { notificationRecipients: [] }]) {
    const { run, sent } = createQueue(settings)
    await run()
    assert.deepStrictEqual(sent, [{ to: 'Owner@Agency.com', locale: 'en' }])
  }
}

async function testQueueNotifiesOwnerAndRecipientsInFormLocale() {
  const { run, sent } = createQueue({
    locale: 'pt-br',
    notificationRecipients: ['info@client.com', 'ops@client.com']
  })
  await run()

  assert.deepStrictEqual(sent, [
    { to: 'Owner@Agency.com', locale: 'en' },
    { to: 'info@client.com', locale: 'pt-br' },
    { to: 'ops@client.com', locale: 'pt-br' }
  ])
}

async function testQueueFallsBackToOwnerLanguageWithoutFormLocale() {
  const { run, sent } = createQueue({ notificationRecipients: ['info@client.com'] })
  await run()
  assert.strictEqual(sent[1].locale, 'en')
}

async function testQueueSkipsRecipientEqualToOwner() {
  const { run, sent } = createQueue({
    notificationRecipients: ['owner@agency.com', 'info@client.com']
  })
  await run()
  assert.deepStrictEqual(
    sent.map(mail => mail.to),
    ['Owner@Agency.com', 'info@client.com']
  )
}

async function testQueueIsolatesPerRecipientFailures() {
  const { run, sent, attempted, logs } = createQueue(
    { notificationRecipients: ['bad@client.com', 'good@client.com'] },
    { failFor: ['bad@client.com'] }
  )

  await assert.rejects(run(), /1 of 3/)
  // Everyone was attempted exactly once and the healthy addresses were still served
  assert.deepStrictEqual(attempted, ['Owner@Agency.com', 'bad@client.com', 'good@client.com'])
  assert.deepStrictEqual(
    sent.map(mail => mail.to),
    ['Owner@Agency.com', 'good@client.com']
  )
  assert.ok(logs.some(message => message.includes('bad@client.com')))
}

async function testQueueOwnerFailureDoesNotBlockRecipients() {
  const { run, sent } = createQueue(
    { notificationRecipients: ['info@client.com'] },
    { failFor: ['Owner@Agency.com'] }
  )

  await assert.rejects(run(), /1 of 2/)
  assert.deepStrictEqual(
    sent.map(mail => mail.to),
    ['info@client.com']
  )
}

async function testQueueRetryOnlyResendsFailedRecipients() {
  const failFor = ['bad@client.com']
  const { run, sent, attempted } = createQueue(
    { notificationRecipients: ['bad@client.com', 'good@client.com'] },
    { failFor }
  )

  await assert.rejects(run(), /1 of 3/)

  // Bull retries the same job once the transient failure is gone
  failFor.length = 0
  attempted.length = 0
  await run()

  assert.deepStrictEqual(attempted, ['bad@client.com'])
  assert.deepStrictEqual(
    sent.map(mail => mail.to),
    ['Owner@Agency.com', 'good@client.com', 'bad@client.com']
  )
}

async function testQueueRecordsNotifiedRecipientsOnJob() {
  const { run, job } = createQueue(
    { notificationRecipients: ['bad@client.com', 'good@client.com'] },
    { failFor: ['bad@client.com'] }
  )

  await assert.rejects(run(), /1 of 3/)
  assert.deepStrictEqual(job.data.notified, ['Owner@Agency.com', 'good@client.com'])
  assert.strictEqual(job.data.formId, 'form_1')
}

async function testQueueKeepsSendingWhenRecordingProgressFails() {
  const { run, sent, job, logs } = createQueue({ notificationRecipients: ['info@client.com'] })
  job.update = async () => {
    throw new Error('redis down')
  }

  await run()
  assert.deepStrictEqual(
    sent.map(mail => mail.to),
    ['Owner@Agency.com', 'info@client.com']
  )
  assert.ok(logs.some(message => message.includes('failed to record')))
}

async function run() {
  testNormalizeTrimsLowercasesAndDedupes()
  testNormalizeTreatsNullAndUndefinedAsEmpty()
  testNormalizeRejectsInvalidEmails()
  testNormalizeRejectsNonArray()
  testNormalizeEnforcesMaximumAfterDedupe()
  testReadIsLenient()
  await testUpdatePersistsNormalizedRecipients()
  await testUpdateEmptyListClearsRecipients()
  await testUpdateOmittedRecipientsLeavesSettingUntouched()
  await testUpdateRejectsInvalidRecipients()
  await testQueueWithoutRecipientsOnlyNotifiesOwner()
  await testQueueNotifiesOwnerAndRecipientsInFormLocale()
  await testQueueFallsBackToOwnerLanguageWithoutFormLocale()
  await testQueueSkipsRecipientEqualToOwner()
  await testQueueIsolatesPerRecipientFailures()
  await testQueueOwnerFailureDoesNotBlockRecipients()
  await testQueueRetryOnlyResendsFailedRecipients()
  await testQueueRecordsNotifiedRecipientsOnJob()
  await testQueueKeepsSendingWhenRecordingProgressFails()
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
