// @vitest-environment jsdom
// Opt-in fuzz harness for the submissions table:
//   random JSON -> fieldValuesToAnswers (the real validation gate) -> stored answer
//   -> SubmissionCell (table cell + detail modal) and the answer-utils serialisers.
//
//   FUZZ=1 pnpm --filter ./packages/webapp exec vitest run --config vitest.config.mts \
//     test/submission-cell-fuzz.test.tsx            # FUZZ_SEED, FUZZ_ITER optional
//
// Skipped by default because it currently fails on known bugs:
//   - multiple_choice {value: [], other: {a: 1}}  -> table cell + detail modal throw
//     "Objects are not valid as a React child" (validate accepts any non-empty `other`)
//   - input_table [{col1: {a: 1}}]                -> detail modal throws the same
//   - address {address1: {a: 1}, city, ...}       -> detail modal throws the same
//   - date_range {} / phone_number [null]         -> validate throws a TypeError, not a
//     ValidateError, so the 400 carries no message
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, expect, test } from 'vitest'

import {
  answersToApiObject,
  answersToHtml,
  answersToJson,
  answersToPlain,
  fieldValuesToAnswers
} from '@heyform-inc/answer-utils'

import i18n from '../src/i18n'
import SubmissionCell from '../src/pages/form/Submissions/SubmissionCell'

const SEED = Number(process.env.FUZZ_SEED || 1)
const ITER = Number(process.env.FUZZ_ITER || 4000)

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const KEYS = [
  'value',
  'other',
  'firstName',
  'lastName',
  'address1',
  'address2',
  'city',
  'state',
  'zip',
  'country',
  'start',
  'end',
  'url',
  'filename',
  'key',
  'urlPrefix',
  'amount',
  'currency',
  'paymentIntentId',
  'receiptUrl',
  'c1',
  'c2',
  'col1',
  'col2',
  'name'
]
const STRINGS = [
  '',
  ' ',
  'a',
  'abc',
  '3',
  '3abc',
  '0x3',
  '3.7',
  '-1',
  '1e3',
  '12',
  'c1',
  'c2',
  'y',
  'n',
  'http://example.com/a.png',
  'https://example.com/f.pdf',
  '2024-01-01',
  '2024-02-01',
  'data:image/png;base64,AAAA',
  'a@b.co',
  '+14155552671',
  'US',
  '__other__',
  '<b>x</b>'
]

function gen(r: () => number, depth = 0): any {
  const x = r()
  if (x < 0.08) return null
  if (x < 0.12) return undefined
  if (x < 0.2) return r() < 0.5
  if (x < 0.32) return [0, 1, 3, 5, 7, -1, 3.5, 1e21, 11][Math.floor(r() * 9)]
  if (x < 0.55) return STRINGS[Math.floor(r() * STRINGS.length)]
  if (depth > 2) return 'leaf'
  if (x < 0.72) return Array.from({ length: Math.floor(r() * 3) }, () => gen(r, depth + 1))
  const o: any = {}
  const n = Math.floor(r() * 6)
  for (let i = 0; i < n; i++) o[KEYS[Math.floor(r() * KEYS.length)]] = gen(r, depth + 1)
  return o
}

// Near-valid values: right outer shape, arbitrary leaves.
function near(kind: string, r: () => number): any {
  const g = () => gen(r, 1)
  const s = () => STRINGS[Math.floor(r() * STRINGS.length)]
  switch (kind) {
    case FieldKindEnum.FULL_NAME:
      return { firstName: r() < 0.5 ? s() : g(), lastName: r() < 0.5 ? s() : g() }
    case FieldKindEnum.ADDRESS:
      return Object.fromEntries(
        ['address1', 'address2', 'city', 'state', 'zip', 'country'].map(k => [
          k,
          r() < 0.6 ? 'x' : g()
        ])
      )
    case FieldKindEnum.DATE_RANGE:
      return { start: r() < 0.7 ? '2024-01-01' : g(), end: r() < 0.7 ? '2024-02-01' : g() }
    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      return {
        value: [['c1'], ['c1', 'c1'], [], ['c2'], g()][Math.floor(r() * 5)],
        ...(r() < 0.6 ? { other: r() < 0.5 ? s() : g() } : {})
      }
    case FieldKindEnum.INPUT_TABLE:
      return [{ col1: r() < 0.5 ? s() : g(), col2: r() < 0.5 ? s() : g() }]
    case FieldKindEnum.FILE_UPLOAD:
      return { url: 'https://example.com/f.pdf', filename: g(), size: g() }
    case FieldKindEnum.YES_NO:
      return ['y', 'n', { value: 'y' }, ['y']][Math.floor(r() * 4)]
    case FieldKindEnum.NUMBER:
    case FieldKindEnum.RATING:
    case FieldKindEnum.OPINION_SCALE:
      return [[3], ['3'], '3abc', ' 3', '0x3', '3.9', 3.9, '1e3', -0, [[2]], '2,5'][
        Math.floor(r() * 11)
      ]
    default:
      return g()
  }
}

const choices = [
  { id: 'c1', label: 'One' },
  { id: 'c2', label: 'Two' }
]
const P: Record<string, any> = {
  [FieldKindEnum.MULTIPLE_CHOICE]: { choices, allowOther: true, allowMultiple: true },
  [FieldKindEnum.PICTURE_CHOICE]: { choices, allowMultiple: false },
  [FieldKindEnum.YES_NO]: {
    choices: [
      { id: 'y', label: 'Yes' },
      { id: 'n', label: 'No' }
    ]
  },
  [FieldKindEnum.RATING]: { total: 5 },
  [FieldKindEnum.OPINION_SCALE]: { total: 10 },
  [FieldKindEnum.DATE]: { format: 'YYYY-MM-DD' },
  [FieldKindEnum.DATE_RANGE]: { format: 'YYYY-MM-DD' },
  [FieldKindEnum.INPUT_TABLE]: {
    tableColumns: [
      { id: 'col1', label: 'Col 1' },
      { id: 'col2', label: 'Col 2' }
    ]
  },
  [FieldKindEnum.PAYMENT]: { price: { type: 'number', value: 5 }, currency: 'usd' }
}
const KINDS = [
  FieldKindEnum.SHORT_TEXT,
  FieldKindEnum.LONG_TEXT,
  FieldKindEnum.NUMBER,
  FieldKindEnum.YES_NO,
  FieldKindEnum.MULTIPLE_CHOICE,
  FieldKindEnum.PICTURE_CHOICE,
  FieldKindEnum.FILE_UPLOAD,
  FieldKindEnum.RATING,
  FieldKindEnum.OPINION_SCALE,
  FieldKindEnum.DATE,
  FieldKindEnum.DATE_RANGE,
  FieldKindEnum.INPUT_TABLE,
  FieldKindEnum.FULL_NAME,
  FieldKindEnum.ADDRESS,
  FieldKindEnum.EMAIL,
  FieldKindEnum.URL,
  FieldKindEnum.PHONE_NUMBER,
  FieldKindEnum.COUNTRY,
  FieldKindEnum.SIGNATURE,
  FieldKindEnum.LEGAL_TERMS,
  FieldKindEnum.PAYMENT
]

// Mirrors server/src/utils/submission.ts assertSafeSpecialFieldAnswers (the parts
// that do not need trusted-origin config) and the resolver's payment overwrite.
function serverGate(kind: string, v: any): boolean {
  if (v === undefined || v === null) return true
  switch (kind) {
    case FieldKindEnum.LEGAL_TERMS:
      return typeof v === 'boolean'
    case FieldKindEnum.INPUT_TABLE:
      return (
        Array.isArray(v) && v.every(r => r !== null && typeof r === 'object' && !Array.isArray(r))
      )
    case FieldKindEnum.SIGNATURE:
      return typeof v === 'string' && /^https?:\/\/example\.com\//.test(v)
    case FieldKindEnum.FILE_UPLOAD:
      return (
        (typeof v === 'string' && /^https?:\/\/example\.com\//.test(v)) ||
        (v &&
          typeof v === 'object' &&
          typeof v.url === 'string' &&
          /^https?:\/\/example\.com\//.test(v.url))
      )
    case FieldKindEnum.PAYMENT:
      return typeof v === 'object' && !Array.isArray(v)
  }
  return true
}

beforeAll(async () => {
  await i18n.changeLanguage('en')
  ;(window as any).heyform = { uploadOrigins: ['http://example.com', 'https://example.com'] }
})

test.skipIf(!process.env.FUZZ)(
  'fuzz: accepted answers never crash the table, the detail view or exports',
  () => {
    const r = rng(SEED)
    const crashes = new Map<string, { kind: string; where: string; value: any; err: string }>()
    const accepted: Record<string, number> = {}
    const shapes: Record<string, Set<string>> = {}

    for (let i = 0; i < ITER; i++) {
      for (const kind of KINDS) {
        const required = r() < 0.5
        const field: any = {
          id: 'f',
          title: 'Q',
          kind,
          validations: { required },
          properties: P[kind] || {}
        }
        let raw = r() < 0.5 ? gen(r) : near(kind, r)
        if (raw !== undefined) raw = JSON.parse(JSON.stringify(raw)) // GraphQL JSON
        if (!serverGate(kind, raw)) continue

        let answers: any[]
        try {
          answers = fieldValuesToAnswers([field], { f: raw })
        } catch (e: any) {
          if (e?.response) continue // ValidateError -> 400, fine
          const key = `${kind}|validate|${String(e?.message).slice(0, 60)}`
          if (!crashes.has(key))
            crashes.set(key, {
              kind,
              where: 'validate (non-ValidateError)',
              value: raw,
              err: String(e?.message)
            })
          continue
        }
        for (const a of answers) {
          if (a.kind === FieldKindEnum.PAYMENT) {
            a.value = { amount: 500, currency: 'usd', billingDetails: { name: '' } }
          }
        }
        answers = JSON.parse(JSON.stringify(answers)) // Mongo round trip
        accepted[kind] = (accepted[kind] || 0) + 1
        const t = (v: any) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)
        ;(shapes[kind] ||= new Set()).add(t(answers[0]?.value))

        const submission = { id: 's', answers }
        for (const isTableCell of [true, false]) {
          try {
            renderToStaticMarkup(
              <SubmissionCell
                field={field}
                submission={submission as any}
                answer={answers[0]}
                isTableCell={isTableCell}
              />
            )
          } catch (e: any) {
            const where = isTableCell ? 'table cell' : 'detail modal'
            const key = `${kind}|${where}|${String(e?.message).slice(0, 50)}`
            if (!crashes.has(key))
              crashes.set(key, { kind, where, value: raw, err: String(e?.message).slice(0, 160) })
          }
        }
        for (const [name, fn] of [
          ['answersToPlain', answersToPlain],
          ['answersToHtml', answersToHtml],
          ['answersToJson', (a: any) => answersToJson(a, [field])],
          ['answersToApiObject', answersToApiObject]
        ] as const) {
          try {
            ;(fn as any)(answers)
          } catch (e: any) {
            const key = `${kind}|${name}|${String(e?.message).slice(0, 50)}`
            if (!crashes.has(key))
              crashes.set(key, {
                kind,
                where: name,
                value: raw,
                err: String(e?.message).slice(0, 160)
              })
          }
        }
      }
    }

    console.log('accepted per kind:', JSON.stringify(accepted))
    console.log(
      'stored value types per kind:',
      JSON.stringify(Object.fromEntries(Object.entries(shapes).map(([k, s]) => [k, [...s]])))
    )
    for (const c of crashes.values()) {
      console.log(
        `CRASH [${c.kind}] in ${c.where}: ${c.err}\n   value = ${JSON.stringify(c.value)}`
      )
    }
    expect([...crashes.keys()]).toEqual([])
  }
)
