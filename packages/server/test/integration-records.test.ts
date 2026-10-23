import * as assert from 'assert'

const { IntegrationQueue, SKIPPED_JOB } = require('../src/queue/integration-queue')
const { IntegrationService } = require('../src/service/integration.service')
const { IntegrationAuthError } = require('../src/service/integration-auth.service')
const {
  IntegrationRecordsResolver
} = require('../src/resolver/integration/integration-records.resolver')
const { IntegrationRecordStatusEnum } = require('../src/model/integration-record.model')

const { SUCCEEDED, FAILED } = IntegrationRecordStatusEnum

const JOB_DATA = {
  appId: 'webhook',
  formId: 'form_1',
  integrationId: 'integration_1',
  submissionId: 'submission_1'
}

function createJob(attemptsMade: number, attempts?: number) {
  return {
    id: 7,
    queue: { name: 'IntegrationQueue' },
    data: JOB_DATA,
    attemptsMade,
    opts: attempts === undefined ? {} : { attempts }
  }
}

function createQueue(addRecord?: (record: any) => Promise<void>) {
  const records: any[] = []
  const integrationService = {
    addRecord:
      addRecord ??
      (async (record: any) => {
        records.push(record)
      })
  }
  const queue = new IntegrationQueue({}, integrationService, {}, {}, {})

  return { queue, records }
}

// --- queue events -----------------------------------------------------------

async function testRecordsSuccessWithAttemptNumber() {
  const { queue, records } = createQueue()

  // Succeeded on the third try: two failed attempts before it
  await queue.recordSuccess(createJob(2, 3), undefined)

  assert.deepStrictEqual(records, [{ ...JOB_DATA, status: SUCCEEDED, attempt: 3, maxAttempts: 3 }])
}

async function testSkippedJobsAreNotRecorded() {
  const { queue, records } = createQueue()

  await queue.recordSuccess(createJob(0, 3), SKIPPED_JOB)
  assert.deepStrictEqual(records, [])
}

async function testRecordsFailureThatWillBeRetried() {
  const { queue, records } = createQueue()

  // Bull counts the failed attempt before emitting `failed`
  await queue.recordFailure(createJob(1, 3), new Error('Response code 502 (Bad Gateway)'))

  assert.deepStrictEqual(records, [
    {
      ...JOB_DATA,
      status: FAILED,
      attempt: 1,
      maxAttempts: 3,
      willRetry: true,
      error: 'Response code 502 (Bad Gateway)'
    }
  ])
}

async function testRecordsFinalFailure() {
  const { queue, records } = createQueue()

  await queue.recordFailure(createJob(3, 3), new Error('Promise timed out after 60000 ms'))

  assert.strictEqual(records[0].attempt, 3)
  assert.strictEqual(records[0].willRetry, false)
  assert.strictEqual(records[0].error, 'Promise timed out after 60000 ms')
}

async function testAuthFailuresAreFinal() {
  const { queue, records } = createQueue()

  await queue.recordFailure(
    createJob(1, 5),
    new IntegrationAuthError('Fake rejected the token request: invalid_grant', true)
  )

  assert.strictEqual(records[0].willRetry, false)
  assert.strictEqual(records[0].attempt, 1)
  assert.strictEqual(records[0].maxAttempts, 5)
}

async function testDefaultsToOneAttempt() {
  const { queue, records } = createQueue()

  await queue.recordFailure(createJob(1), new Error('boom'))
  assert.deepStrictEqual(
    [records[0].attempt, records[0].maxAttempts, records[0].willRetry],
    [1, 1, false]
  )
}

async function testRecordingErrorsDoNotFailTheJob() {
  const { queue } = createQueue(async () => {
    throw new Error('mongo down')
  })
  const logged: string[] = []
  queue.logger = { error: (message: string) => logged.push(message) }

  await queue.recordSuccess(createJob(0, 3), undefined)
  await queue.recordFailure(createJob(1, 3), new Error('x'))

  assert.deepStrictEqual(logged, [
    "Couldn't record IntegrationQueue#7: mongo down",
    "Couldn't record IntegrationQueue#7: mongo down"
  ])
}

async function testProcessResultDistinguishesSkippedJobs() {
  const runs: any[] = []
  const app = { id: 'webhook', run: async () => runs.push(1) && 'response body' }
  const createProcessQueue = (integration: any) =>
    new IntegrationQueue(
      { findById: () => app },
      { findById: async () => integration },
      { getRunAuth: async () => ({ type: 'none' }) },
      { findById: async () => ({ id: 'submission_1' }) },
      { findById: async () => ({ id: 'form_1' }) }
    )

  // The app's result isn't returned, so Bull doesn't store it
  assert.strictEqual(
    await createProcessQueue({ id: 'integration_1', status: 1, config: {} }).process({
      data: JOB_DATA
    }),
    undefined
  )
  assert.strictEqual(runs.length, 1)

  // A deleted integration: nothing ran, nothing to record
  assert.strictEqual(await createProcessQueue(null).process({ data: JOB_DATA }), SKIPPED_JOB)
  assert.strictEqual(runs.length, 1)
}

// --- service ----------------------------------------------------------------

function createService() {
  const created: any[] = []
  const deleted: any[] = []
  const recordModel = {
    create: async (doc: any) => created.push(doc),
    deleteMany: async (filter: any) => deleted.push(filter)
  }
  const integrationModel = {
    deleteOne: async () => ({ deletedCount: 1 })
  }
  const service = new IntegrationService(integrationModel, recordModel, {}, {}, {})

  return { service, created, deleted }
}

async function testAddRecordShortensLongErrors() {
  const { service, created } = createService()

  await service.addRecord({
    ...JOB_DATA,
    status: FAILED,
    attempt: 1,
    maxAttempts: 1,
    error: 'e'.repeat(2000)
  })
  await service.addRecord({ ...JOB_DATA, status: SUCCEEDED, attempt: 1, maxAttempts: 1 })

  assert.strictEqual(created[0].error.length, 500)
  assert.ok(created[0].error.endsWith('…'))
  assert.strictEqual(created[0].willRetry, false)
  assert.strictEqual(created[1].error, undefined)
}

async function testOnlyTheCurrentIntegrationsRecordsAreListed() {
  const queries: any[] = []
  const chain = (filter: any) => {
    queries.push(filter)
    return { sort: () => ({ limit: async () => [] }) }
  }
  let current: any = { id: 'integration_2' }
  const service = new IntegrationService(
    { findOne: async () => current },
    { find: chain },
    {},
    {},
    {}
  )

  await service.findRecords('form_1', 'webhook', 20)
  // Records left by a deleted integration_1 (e.g. a job that finished after
  // the delete) are not included
  assert.deepStrictEqual(queries, [
    { formId: 'form_1', appId: 'webhook', integrationId: 'integration_2' }
  ])

  current = null
  assert.deepStrictEqual(await service.findRecords('form_1', 'webhook', 20), [])
  assert.strictEqual(queries.length, 1)
}

async function testDeletingAnIntegrationDeletesItsRecords() {
  const { service, deleted } = createService()

  assert.strictEqual(await service.delete('form_1', 'webhook'), true)
  assert.deepStrictEqual(deleted, [{ formId: 'form_1', appId: 'webhook' }])
}

// --- resolver ---------------------------------------------------------------

async function testResolverReturnsRecentRecordsForTheFormApp() {
  const calls: any[] = []
  const integrationService = {
    findRecords: async (formId: string, appId: string, limit: number) => {
      calls.push([formId, appId, limit])
      return [
        {
          id: 'record_2',
          submissionId: 'submission_2',
          status: FAILED,
          attempt: 2,
          maxAttempts: 3,
          willRetry: true,
          error: 'Response code 500 (Internal Server Error)',
          createdAt: new Date('2026-10-23T10:00:05.900Z'),
          // Never exposed
          integrationId: 'integration_1',
          formId: 'form_1'
        },
        {
          id: 'record_1',
          submissionId: 'submission_1',
          status: SUCCEEDED,
          attempt: 1,
          maxAttempts: 3,
          createdAt: new Date('2026-10-23T10:00:00.000Z')
        }
      ]
    }
  }

  const records = await new IntegrationRecordsResolver(integrationService).integrationRecords({
    formId: 'form_1',
    appId: 'webhook'
  })

  assert.deepStrictEqual(calls, [['form_1', 'webhook', 20]])
  assert.deepStrictEqual(records, [
    {
      id: 'record_2',
      submissionId: 'submission_2',
      status: FAILED,
      attempt: 2,
      maxAttempts: 3,
      willRetry: true,
      error: 'Response code 500 (Internal Server Error)',
      createdAt: 1792749605
    },
    {
      id: 'record_1',
      submissionId: 'submission_1',
      status: SUCCEEDED,
      attempt: 1,
      maxAttempts: 3,
      willRetry: false,
      error: undefined,
      createdAt: 1792749600
    }
  ])
}

async function run() {
  await testRecordsSuccessWithAttemptNumber()
  await testSkippedJobsAreNotRecorded()
  await testRecordsFailureThatWillBeRetried()
  await testRecordsFinalFailure()
  await testAuthFailuresAreFinal()
  await testDefaultsToOneAttempt()
  await testRecordingErrorsDoNotFailTheJob()
  await testProcessResultDistinguishesSkippedJobs()
  await testAddRecordShortensLongErrors()
  await testOnlyTheCurrentIntegrationsRecordsAreListed()
  await testDeletingAnIntegrationDeletesItsRecords()
  await testResolverReturnsRecentRecordsForTheFormApp()
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
