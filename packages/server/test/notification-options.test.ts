import * as assert from 'assert'

import { UpdateFormResolver } from '../src/resolver/form/update-form.resolver'
import { MailService } from '../src/service/mail.service'
import {
  MAX_RESPONDENT_NAME_LENGTH,
  readRespondentEmail,
  readRespondentName
} from '../src/utils/notification-options'

import { SubmissionNotificationQueue } from '../src/queue/submission-notification.queue'

function answer(kind: string, value: unknown) {
  return { id: `${kind}_${Math.random()}`, title: kind, kind, value } as any
}

// --- respondent email -------------------------------------------------------

function testRespondentEmailIsFirstValidEmailAnswer() {
  assert.strictEqual(
    readRespondentEmail([
      answer('short_text', 'jane@example.com'),
      answer('email', 'not-an-email'),
      answer('email', '  Jane@Example.com '),
      answer('email', 'other@example.com')
    ]),
    'Jane@Example.com'
  )
}

function testRespondentEmailRejectsUnsafeValues() {
  for (const bad of [
    'jane@example.com\r\nBcc: victim@example.com',
    'jane@example.com\nX-Header: 1',
    'Jane <jane@example.com>',
    '',
    undefined,
    null,
    42,
    { value: 'jane@example.com' }
  ]) {
    assert.strictEqual(
      readRespondentEmail([answer('email', bad)]),
      undefined,
      `expected ${JSON.stringify(bad)} to be rejected`
    )
  }
}

function testRespondentEmailIsUndefinedWithoutAnswers() {
  assert.strictEqual(readRespondentEmail([]), undefined)
  assert.strictEqual(readRespondentEmail(undefined), undefined)
}

// --- respondent name --------------------------------------------------------

function testRespondentNamePrefersFullNameOverShortText() {
  assert.strictEqual(
    readRespondentName([
      answer('short_text', 'Company Ltd'),
      answer('full_name', { firstName: 'Jane', lastName: 'Doe' })
    ]),
    'Jane Doe'
  )
}

function testRespondentNameFallsBackToFirstNonEmptyShortText() {
  assert.strictEqual(
    readRespondentName([
      answer('full_name', { firstName: ' ', lastName: '' }),
      answer('short_text', '   '),
      answer('short_text', 'Jane'),
      answer('short_text', 'Other')
    ]),
    'Jane'
  )
}

function testRespondentNameCollapsesWhitespaceAndStripsLineBreaks() {
  assert.strictEqual(
    readRespondentName([answer('short_text', '  Jane \r\n Bcc: x@y.com\t\u0000 Doe ')]),
    'Jane Bcc: x@y.com Doe'
  )
}

function testRespondentNameIsCapped() {
  const name = readRespondentName([answer('short_text', 'a'.repeat(500))])
  assert.ok(name)
  assert.ok(Array.from(name).length <= MAX_RESPONDENT_NAME_LENGTH)
}

function testRespondentNameIsUndefinedWhenNothingUsable() {
  assert.strictEqual(readRespondentName([]), undefined)
  assert.strictEqual(readRespondentName(undefined), undefined)
  assert.strictEqual(
    readRespondentName([answer('email', 'jane@example.com'), answer('short_text', 7)]),
    undefined
  )
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

async function testUpdatePersistsBothTrueAndFalse() {
  for (const value of [true, false]) {
    const updates = await runUpdate({
      notificationReplyToRespondent: value,
      notificationSubjectRespondent: value,
      notificationSkipOwner: value
    })

    assert.strictEqual(updates['settings.notificationReplyToRespondent'], value)
    assert.strictEqual(updates['settings.notificationSubjectRespondent'], value)
    assert.strictEqual(updates['settings.notificationSkipOwner'], value)
  }
}

async function testUpdateOmittedOptionsLeaveSettingsUntouched() {
  const updates = await runUpdate({ name: 'Renamed' })

  for (const key of [
    'notificationReplyToRespondent',
    'notificationSubjectRespondent',
    'notificationSkipOwner'
  ]) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(updates, `settings.${key}`), false)
  }
}

// --- mail service -----------------------------------------------------------

async function sendThroughMailService(
  options: Record<string, any>,
  locale?: string
): Promise<Record<string, any>> {
  const jobs: Record<string, any>[] = []
  const service = new MailService({ add: async (job: any) => jobs.push(job) } as any)

  await service.submissionNotification(
    'owner@agency.com',
    { formName: 'Contact', submission: '<ol></ol>', link: 'https://example.com', ...options },
    locale
  )

  assert.strictEqual(jobs.length, 1)
  return jobs[0].data
}

async function testMailDefaultsAreUnchanged() {
  const mail = await sendThroughMailService({})

  assert.strictEqual(mail.subject, 'A new submission was received for Contact')
  assert.strictEqual(Object.prototype.hasOwnProperty.call(mail, 'replyTo'), false)
}

async function testMailAppendsRespondentToLocalizedSubject() {
  const en = await sendThroughMailService({ respondentName: 'Jane Doe' })
  assert.strictEqual(en.subject, 'A new submission was received for Contact — Jane Doe')

  const pt = await sendThroughMailService({ respondentName: 'Jane Doe' }, 'pt-br')
  assert.strictEqual(pt.subject, 'Novo envio recebido em Contact — Jane Doe')
}

async function testMailSubjectNeverContainsLineBreaks() {
  const mail = await sendThroughMailService({ respondentName: 'Jane\r\nBcc: x@y.com' })
  assert.ok(!/[\r\n]/.test(mail.subject))
}

async function testMailRespondentNameIsNotAPlaceholderValue() {
  const mail = await sendThroughMailService({ respondentName: 'Jane Doe' })
  assert.ok(!mail.html.includes('Jane Doe'))
}

async function testMailSetsReplyTo() {
  const mail = await sendThroughMailService({ replyTo: 'jane@example.com' })
  assert.strictEqual(mail.replyTo, 'jane@example.com')
}

// --- queue ------------------------------------------------------------------

interface SentMail {
  to: string
  options: Record<string, any>
}

function createQueue(settings: Record<string, any> | undefined, answers: any[]) {
  const sent: SentMail[] = []

  const queue = new SubmissionNotificationQueue(
    { findById: async () => ({ answers }) } as any,
    {
      submissionNotification: async (to: string, options: Record<string, any>) => {
        sent.push({ to, options })
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
  queue.logger = { error: () => undefined } as any

  const job = {
    id: 'job_1',
    queue: { name: 'SubmissionNotificationQueue' },
    data: { formId: 'form_1', submissionId: 'submission_1' } as Record<string, any>,
    update: async (data: Record<string, any>) => {
      job.data = data
    }
  }

  return { run: () => queue.process(job as any), sent }
}

const respondentAnswers = [
  answer('full_name', { firstName: 'Jane', lastName: 'Doe' }),
  answer('email', 'jane@example.com')
]

async function testQueueWithoutOptionsKeepsMailsUnchanged() {
  for (const settings of [undefined, {}, { notificationRecipients: ['info@client.com'] }]) {
    const { run, sent } = createQueue(settings, respondentAnswers)
    await run()

    for (const mail of sent) {
      assert.strictEqual(mail.options.replyTo, undefined)
      assert.strictEqual(mail.options.respondentName, undefined)
    }
  }
}

async function testQueueSetsReplyToWhenEnabled() {
  const { run, sent } = createQueue(
    { notificationReplyToRespondent: true, notificationRecipients: ['info@client.com'] },
    respondentAnswers
  )
  await run()

  assert.deepStrictEqual(
    sent.map(mail => mail.options.replyTo),
    ['jane@example.com', 'jane@example.com']
  )
}

async function testQueueOmitsReplyToWithoutValidRespondentEmail() {
  const { run, sent } = createQueue({ notificationReplyToRespondent: true }, [
    answer('email', 'broken')
  ])
  await run()

  assert.strictEqual(sent[0].options.replyTo, undefined)
}

async function testQueueAddsRespondentNameWhenEnabled() {
  const { run, sent } = createQueue({ notificationSubjectRespondent: true }, respondentAnswers)
  await run()

  assert.strictEqual(sent[0].options.respondentName, 'Jane Doe')
  assert.strictEqual(sent[0].options.replyTo, undefined)
}

async function testQueueSkipsOwnerWhenRecipientsExist() {
  const { run, sent } = createQueue(
    { notificationSkipOwner: true, notificationRecipients: ['info@client.com', 'ops@client.com'] },
    respondentAnswers
  )
  await run()

  assert.deepStrictEqual(
    sent.map(mail => mail.to),
    ['info@client.com', 'ops@client.com']
  )
}

async function testQueueKeepsOwnerWhenThereAreNoRecipients() {
  for (const notificationRecipients of [undefined, [], ['owner@agency.com']]) {
    const { run, sent } = createQueue(
      { notificationSkipOwner: true, notificationRecipients },
      respondentAnswers
    )
    await run()

    assert.deepStrictEqual(
      sent.map(mail => mail.to),
      ['Owner@Agency.com']
    )
  }
}

async function run() {
  testRespondentEmailIsFirstValidEmailAnswer()
  testRespondentEmailRejectsUnsafeValues()
  testRespondentEmailIsUndefinedWithoutAnswers()
  testRespondentNamePrefersFullNameOverShortText()
  testRespondentNameFallsBackToFirstNonEmptyShortText()
  testRespondentNameCollapsesWhitespaceAndStripsLineBreaks()
  testRespondentNameIsCapped()
  testRespondentNameIsUndefinedWhenNothingUsable()
  await testUpdatePersistsBothTrueAndFalse()
  await testUpdateOmittedOptionsLeaveSettingsUntouched()
  await testMailDefaultsAreUnchanged()
  await testMailAppendsRespondentToLocalizedSubject()
  await testMailSubjectNeverContainsLineBreaks()
  await testMailRespondentNameIsNotAPlaceholderValue()
  await testMailSetsReplyTo()
  await testQueueWithoutOptionsKeepsMailsUnchanged()
  await testQueueSetsReplyToWhenEnabled()
  await testQueueOmitsReplyToWithoutValidRespondentEmail()
  await testQueueAddsRespondentNameWhenEnabled()
  await testQueueSkipsOwnerWhenRecipientsExist()
  await testQueueKeepsOwnerWhenThereAreNoRecipients()
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
