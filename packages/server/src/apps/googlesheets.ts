import { Answer, FieldKindEnum, STATEMENT_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import got from 'got'

import { answerToText } from '../service/export-file.service'
import { flattenFields, htmlUtils } from '@heyform-inc/answer-utils'
import type { FormModel, SubmissionModel } from '@model'

import { AppError, defineApp } from './types'

export const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

export const SUBMITTED_AT = 'Submitted at'
export const SUBMISSION_ID = 'Submission ID'

// Google Sheets' limit on the text in one cell
const MAX_CELL_LENGTH = 50_000
const REQUEST_TIMEOUT = 15_000

type CellValue = string | number

interface Cell {
  header: string
  value: CellValue
}

interface Tab {
  sheetId: number
  title: string
  columnCount: number
}

// --- Spreadsheet URLs -----------------------------------------------------------

/**
 * The spreadsheet id in a Google Sheets URL, e.g.
 * https://docs.google.com/spreadsheets/d/<id>/edit#gid=0, or a bare id.
 */
export function parseSpreadsheetId(input: unknown): string | undefined {
  if (typeof input !== 'string') {
    return
  }

  const value = input.trim()

  if (/^https?:\/\//i.test(value)) {
    let url: URL

    try {
      url = new URL(value)
    } catch (_) {
      return
    }

    if (url.hostname !== 'docs.google.com') {
      return
    }

    return url.pathname.match(
      /^\/spreadsheets\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{20,128})(?:\/|$)/
    )?.[1]
  }

  return /^[A-Za-z0-9_-]{20,128}$/.test(value) ? value : undefined
}

export function spreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
}

// --- Rows ---------------------------------------------------------------------

// 0 → A, 26 → AA
export function columnLetter(index: number): string {
  let letters = ''

  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters
  }

  return letters
}

function plainTitle(title: unknown): string {
  const html = Array.isArray(title) ? htmlUtils.serialize(title) : String(title ?? '')
  return htmlUtils.plain(html).trim()
}

function cellValue(answer?: Answer): CellValue {
  if (!answer) {
    return ''
  }

  // Numbers stay numbers, so the sheet can add them up
  if (
    answer.kind === FieldKindEnum.NUMBER &&
    typeof answer.value === 'number' &&
    Number.isFinite(answer.value)
  ) {
    return answer.value
  }

  return (answerToText(answer) ?? '').slice(0, MAX_CELL_LENGTH)
}

function submittedAt(submission: SubmissionModel): string {
  const date = submission.endAt ? new Date(submission.endAt * 1000) : new Date()
  // e.g. 2026-10-23 14:05:09 UTC
  return `${date.toISOString().slice(0, 19).replace('T', ' ')} UTC`
}

/**
 * A submission's cells, each under the header of its column: when it was
 * submitted, its id, then each question in form order, titled as in the
 * form. Questions with the same title get " (2)", " (3)"… so each has its
 * own column.
 */
export function submissionCells(form: FormModel, submission: SubmissionModel): Cell[] {
  const used = new Set([SUBMITTED_AT, SUBMISSION_ID])
  const uniqueHeader = (title: string) => {
    const base = title || 'Untitled question'
    let header = base

    for (let n = 2; used.has(header); n++) {
      header = `${base} (${n})`
    }

    used.add(header)
    return header
  }

  const answers = new Map((submission.answers ?? []).map(answer => [answer.id, answer]))
  const cells: Cell[] = [
    { header: SUBMITTED_AT, value: submittedAt(submission) },
    { header: SUBMISSION_ID, value: submission.id }
  ]

  // The questions the CSV export has columns for
  for (const field of flattenFields(form.fields)) {
    if (!STATEMENT_FIELD_KINDS.includes(field.kind)) {
      cells.push({
        header: uniqueHeader(plainTitle(field.title)),
        value: cellValue(answers.get(field.id))
      })
      answers.delete(field.id)
    }
  }

  // Questions deleted from the form since it was submitted
  for (const answer of answers.values()) {
    cells.push({ header: uniqueHeader(plainTitle(answer.title)), value: cellValue(answer) })
  }

  return cells
}

/**
 * Places each cell under the column whose header matches it, adding a
 * header at the end for each cell that has none. Returns the whole header
 * row, with any new headers, and the row to append.
 */
export function placeCells(
  existingHeader: string[],
  cells: Cell[]
): { header: string[]; row: CellValue[] } {
  const header = existingHeader.map(name => String(name ?? ''))
  const columns = new Map<string, number>()

  header.forEach((name, index) => {
    if (name.trim() && !columns.has(name.trim())) {
      columns.set(name.trim(), index)
    }
  })

  const row: CellValue[] = header.map(() => '')

  for (const cell of cells) {
    let index = columns.get(cell.header)

    if (index === undefined) {
      index = header.length
      header.push(cell.header)
      columns.set(cell.header, index)
      row.push('')
    }

    row[index] = cell.value
  }

  return { header, row }
}

// --- Google Sheets API ----------------------------------------------------------

function hasReason(error: any, reason: string): boolean {
  return (
    (Array.isArray(error?.details) && error.details.some((d: any) => d?.reason === reason)) ||
    (Array.isArray(error?.errors) && error.errors.some((e: any) => e?.reason === reason))
  )
}

// A clear, safe message for an error response; never includes the token
function requestError(status: number, body: any): AppError {
  const error = body?.error

  if (status === 401) {
    return AppError.fromStatus(status, 'Google rejected the access token')
  }

  if (
    status === 403 &&
    (hasReason(error, 'SERVICE_DISABLED') || hasReason(error, 'accessNotConfigured'))
  ) {
    return new AppError(
      "The Google Sheets API isn't enabled in this server's Google Cloud project. Ask the server's admin to enable it.",
      { retryable: false }
    )
  }

  if (
    status === 429 ||
    error?.status === 'RESOURCE_EXHAUSTED' ||
    hasReason(error, 'rateLimitExceeded') ||
    hasReason(error, 'userRateLimitExceeded')
  ) {
    return new AppError('Google Sheets rate limit reached', { retryable: true })
  }

  if (status === 403) {
    return new AppError(
      "The connected Google account can't edit this spreadsheet. Share it with the account as an editor, or pick another account.",
      { retryable: false }
    )
  }

  if (status === 404) {
    return new AppError(
      "The spreadsheet wasn't found. Check its URL, and that it hasn't been deleted.",
      { retryable: false }
    )
  }

  if (status >= 500) {
    return AppError.fromStatus(status, `Google Sheets is unavailable (HTTP ${status})`)
  }

  const detail = typeof error?.message === 'string' ? `: ${error.message.slice(0, 200)}` : ''
  return AppError.fromStatus(status, `Google Sheets rejected the request (HTTP ${status})${detail}`)
}

// A1 notation for a tab, quoted so any title works
function tabRange(tab: Tab, cells: string): string {
  return `'${tab.title.replace(/'/g, "''")}'!${cells}`
}

const TAB_FIELDS = 'sheets.properties'

function toTabs(body: any): Tab[] {
  return (Array.isArray(body?.sheets) ? body.sheets : []).map((sheet: any) => ({
    sheetId: Number(sheet?.properties?.sheetId ?? 0),
    title: String(sheet?.properties?.title ?? ''),
    columnCount: Number(sheet?.properties?.gridProperties?.columnCount ?? 0)
  }))
}

export class SheetsClient {
  constructor(
    private readonly apiUrl: string,
    private readonly accessToken: string
  ) {}

  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    options: { searchParams?: Record<string, string>; json?: unknown } = {}
  ): Promise<T> {
    let response: { statusCode: number; body: any }

    try {
      response = await got(`${this.apiUrl}${path}`, {
        method,
        headers: { authorization: `Bearer ${this.accessToken}` },
        searchParams: options.searchParams,
        json: options.json,
        responseType: 'json',
        throwHttpErrors: false,
        followRedirect: false,
        retry: { limit: 0 },
        timeout: REQUEST_TIMEOUT
      })
    } catch (err: any) {
      // got's errors carry the request headers, which include the token
      throw new AppError(`Couldn't reach Google Sheets: ${err?.code || 'network error'}`)
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.body
    }

    throw requestError(response.statusCode, response.body)
  }

  async listTabs(spreadsheetId: string): Promise<Tab[]> {
    const body = await this.request('GET', `/${encodeURIComponent(spreadsheetId)}`, {
      searchParams: { fields: TAB_FIELDS }
    })
    return toTabs(body)
  }

  async findTab(spreadsheetId: string, sheetId: unknown): Promise<Tab> {
    const tab = (await this.listTabs(spreadsheetId)).find(
      row => String(row.sheetId) === String(sheetId)
    )

    if (!tab) {
      throw new AppError(
        "The tab picked in the settings no longer exists. Pick another tab in the integration's settings.",
        { retryable: false }
      )
    }

    return tab
  }

  async create(title: string): Promise<{ spreadsheetId: string; tabs: Tab[] }> {
    const body = await this.request('POST', '', {
      searchParams: { fields: `spreadsheetId,${TAB_FIELDS}` },
      json: { properties: { title } }
    })
    return { spreadsheetId: String(body?.spreadsheetId ?? ''), tabs: toTabs(body) }
  }

  async readHeader(spreadsheetId: string, tab: Tab): Promise<string[]> {
    const range = encodeURIComponent(tabRange(tab, '1:1'))
    const body = await this.request(
      'GET',
      `/${encodeURIComponent(spreadsheetId)}/values/${range}`,
      {
        searchParams: { majorDimension: 'ROWS' }
      }
    )
    const row = body?.values?.[0]
    return Array.isArray(row) ? row.map(value => String(value ?? '')) : []
  }

  async addColumns(spreadsheetId: string, tab: Tab, count: number): Promise<void> {
    await this.request('POST', `/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
      json: {
        requests: [
          { appendDimension: { sheetId: tab.sheetId, dimension: 'COLUMNS', length: count } }
        ]
      }
    })
  }

  // Writes headers into row 1, from the column at `start`
  async writeHeaders(spreadsheetId: string, tab: Tab, start: number, headers: string[]) {
    const range = tabRange(
      tab,
      `${columnLetter(start)}1:${columnLetter(start + headers.length - 1)}1`
    )

    await this.request(
      'PUT',
      `/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
      {
        // RAW: stored as typed, so a title like "=SUM(A1)" is never a formula
        searchParams: { valueInputOption: 'RAW' },
        json: { range, majorDimension: 'ROWS', values: [headers] }
      }
    )
  }

  async appendRow(spreadsheetId: string, tab: Tab, row: CellValue[]): Promise<void> {
    const range = encodeURIComponent(tabRange(tab, 'A1'))

    await this.request('POST', `/${encodeURIComponent(spreadsheetId)}/values/${range}:append`, {
      searchParams: {
        // RAW: answers are stored as typed. With USER_ENTERED an answer like
        // "=IMPORTXML(...)" would run as a formula in the owner's sheet
        // (formula injection).
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS'
      },
      json: { majorDimension: 'ROWS', values: [row] }
    })
  }
}

function requireSpreadsheetId(value: unknown): string {
  const spreadsheetId = parseSpreadsheetId(value)

  if (!spreadsheetId) {
    throw new AppError('Spreadsheet URL must be the URL or ID of a Google Sheets spreadsheet', {
      retryable: false
    })
  }

  return spreadsheetId
}

// --- App ------------------------------------------------------------------------

// `apiUrl` lets tests point the app at a fake Google Sheets API
export function createGoogleSheetsApp(apiUrl = GOOGLE_SHEETS_API) {
  return defineApp({
    id: 'googlesheets',
    name: 'Google Sheets',
    description:
      'Adds a row to a Google Sheets spreadsheet for every submission, with a column for each question.',
    icon: '/static/googlesheets.png',
    auth: {
      type: 'oauth2',
      provider: 'google',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    },
    settings: [
      {
        type: 'switch',
        name: 'createSpreadsheet',
        label: 'Create a new spreadsheet',
        description:
          'When you save, a spreadsheet named after this form is created in the connected Google account.'
      },
      {
        type: 'text',
        name: 'spreadsheet',
        label: 'Spreadsheet URL',
        description: 'The URL or ID of a spreadsheet the connected account can edit.',
        placeholder: 'https://docs.google.com/spreadsheets/d/…',
        required: true,
        visibleWhen: { createSpreadsheet: false }
      },
      {
        type: 'select',
        name: 'sheet',
        label: 'Tab',
        description: 'Row 1 holds the column headers; HeyForm adds one for each new question.',
        placeholder: 'First tab',
        dependsOn: ['spreadsheet'],
        visibleWhen: { createSpreadsheet: false },
        loadOptions: async ({ auth, config }) => {
          const sheets = new SheetsClient(apiUrl, auth.accessToken)
          const tabs = await sheets.listTabs(requireSpreadsheetId(config.spreadsheet))

          return tabs.map(tab => ({ label: tab.title, value: String(tab.sheetId) }))
        }
      }
    ],
    queue: {
      attempts: 5,
      // 10s, 20s, 40s, 80s: past Google's per-minute quota window
      backoff: { type: 'exponential', delay: 10_000 },
      // Up to four requests of 15s each
      timeout: 60_000
    },
    // Stores the spreadsheet as its URL and the tab as its id, which stays the
    // same when the tab is renamed
    validate: async (config, { auth, form }) => {
      const sheets = new SheetsClient(apiUrl, auth.accessToken)

      if (config.createSpreadsheet) {
        const created = await sheets.create(form?.name || 'HeyForm submissions')

        return {
          createSpreadsheet: false,
          spreadsheet: spreadsheetUrl(created.spreadsheetId),
          sheet: String(created.tabs[0]?.sheetId ?? 0)
        }
      }

      const spreadsheetId = requireSpreadsheetId(config.spreadsheet)
      const tabs = await sheets.listTabs(spreadsheetId)
      const tab =
        config.sheet === undefined
          ? tabs[0]
          : tabs.find(row => String(row.sheetId) === config.sheet)

      if (!tab) {
        throw new AppError("The tab wasn't found in this spreadsheet. Pick another tab.", {
          retryable: false
        })
      }

      return {
        createSpreadsheet: false,
        spreadsheet: spreadsheetUrl(spreadsheetId),
        sheet: String(tab.sheetId)
      }
    },
    run: async ({ auth, config, form, submission }) => {
      const sheets = new SheetsClient(apiUrl, auth.accessToken)
      const spreadsheetId = requireSpreadsheetId(config.spreadsheet)
      const tab = await sheets.findTab(spreadsheetId, config.sheet)
      const existing = await sheets.readHeader(spreadsheetId, tab)
      const { header, row } = placeCells(existing, submissionCells(form, submission))

      // New questions get a header at the end of row 1. An empty tab gets the
      // whole header row.
      if (header.length > existing.length) {
        if (header.length > tab.columnCount) {
          await sheets.addColumns(spreadsheetId, tab, header.length - tab.columnCount)
        }

        await sheets.writeHeaders(
          spreadsheetId,
          tab,
          existing.length,
          header.slice(existing.length)
        )
      }

      await sheets.appendRow(spreadsheetId, tab, row)
    }
  })
}

export default createGoogleSheetsApp()
