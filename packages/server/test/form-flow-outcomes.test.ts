// completeSubmission over every answer map, as a respondent or a direct API call could send it.
// Replaces Discard.tla's server half (DiscardedIsValidated, ShownSavingWhenSaved,
// CountdownIsAccepted) with the real resolver: real validation, logic, discard decision and
// time-limit check; only storage, queues and payments are stubbed and counted.
import {
  ActionEnum,
  CaptchaKindEnum,
  ComparisonEnum,
  FieldKindEnum
} from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { CompleteSubmissionResolver } from '../src/resolver/endpoint/complete-submission.resolver'
import { TIME_LIMIT_GRACE_SECONDS, assertOpenToken } from '../src/utils/endpoint'
import {
  applyLogicToFields,
  fieldValuesToAnswers,
  flattenFields,
  isSubmissionDiscarded
} from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'

const TIME_LIMIT = 60

const question = (id: string, kind: FieldKindEnum, required = false, properties = {}) => ({
  id,
  title: id,
  kind,
  validations: { required },
  properties
})
const ending = (id: string, discardSubmission = false) => ({
  id,
  title: id,
  kind: FieldKindEnum.THANK_YOU,
  properties: { discardSubmission }
})
const jump = (fieldId: string, expected: string, to: string) => ({
  fieldId,
  payloads: [
    {
      id: `${fieldId}-${to}`,
      condition: { comparison: ComparisonEnum.IS, expected },
      action: { kind: ActionEnum.NAVIGATE, fieldId: to }
    }
  ]
})

// q1 (required) --"no"--> later, which discards; q2 (a number) and q3 (required) are optional
// to reach; ok saves. A time limit and an IP limit are on.
const form = {
  id: 'form_1',
  teamId: 'team_1',
  name: 'Screening',
  suspended: false,
  fields: [
    question('q1', FieldKindEnum.SHORT_TEXT, true),
    question('q2', FieldKindEnum.NUMBER),
    question('q3', FieldKindEnum.SHORT_TEXT, true),
    ending('ok'),
    ending('later', true)
  ],
  hiddenFields: [],
  logics: [jump('q1', 'no', 'later')],
  variables: [] as any[],
  settings: {
    active: true,
    allowArchive: true,
    captchaKind: CaptchaKindEnum.NONE,
    enableTimeLimit: true,
    timeLimit: TIME_LIMIT,
    enableIpLimit: true,
    ipLimitCount: 10
  }
}

const values: Record<string, unknown[]> = {
  q1: [undefined, '', 'no', 'yes', 3],
  q2: [undefined, 4, '4', 'four', [4]],
  q3: [undefined, '', 'done']
}

function* answerMaps(): Generator<Record<string, unknown>> {
  for (const q1 of values.q1)
    for (const q2 of values.q2)
      for (const q3 of values.q3) {
        yield JSON.parse(JSON.stringify({ q1, q2, q3 }))
      }
}

type Outcome = 'rejected' | 'discarded' | 'stored'

interface Result {
  outcome: Outcome
  message?: string
  stored?: any
  calls: { create: number; ip: number; report: number; integration: number; payment: number }
}

async function submit(
  formOverride: any,
  answers: Record<string, unknown>,
  partialSubmission: boolean,
  openedAgo: number
): Promise<Result> {
  const calls = { create: 0, ip: 0, report: 0, integration: 0, payment: 0 }
  const now = Math.floor(Date.now() / 1_000)
  let stored: any
  const resolver = new CompleteSubmissionResolver(
    {
      decryptToken: () => ({ formId: 'form_1', timestamp: now - openedAgo }),
      assertOpenToken,
      verifySpam: async () => false
    } as any,
    { findById: async () => structuredClone(formOverride) } as any,
    {
      createWithinQuota: async (submission: any) => {
        calls.create++
        stored = submission
        return 'submission_1'
      }
    } as any,
    {
      checkIp: async () => {
        calls.ip++
      }
    } as any,
    { addQueue: () => calls.report++ } as any,
    { addQueue: () => calls.integration++ } as any,
    {
      createPaymentIntent: async () => {
        calls.payment++
        return 'secret'
      }
    } as any
  )

  try {
    await resolver.completeSubmission(
      { ip: '203.0.113.10', deviceId: 'd', lang: 'en', userAgent: {} } as any,
      'anonymous_1',
      { formId: 'form_1', answers, hiddenFields: [], openToken: 't', partialSubmission } as any
    )
  } catch (err: any) {
    return { outcome: 'rejected', message: JSON.stringify(err.response ?? err.message), calls }
  }

  return { outcome: calls.create ? 'stored' : 'discarded', stored, calls }
}

// The questions on the server's route, and which of them hold a valid answer. With `cut`,
// the route stops at the first jump question the answers don't resolve: nobody gets past one.
function route(answers: Record<string, unknown>, cut = false) {
  const jumpIds = form.logics.map(l => l.fieldId)
  let fields = applyLogicToFields(
    flattenFields(structuredClone(form.fields) as any, true),
    form.logics as any,
    [],
    answers as any
  ).fields
  const stop = fields.findIndex(f => jumpIds.includes(f.id) && f.isTouched !== true)

  if (cut && stop > -1) {
    fields = fields.slice(0, stop + 1)
  }

  return fields.map(field => {
    const value = answers[field.id]
    let valid = false
    try {
      // valid as an optional answer, the way the time limit's submission is stored
      fieldValuesToAnswers([{ ...field, validations: {} }], { [field.id]: value })
      valid = !helper.isEmpty(value)
    } catch {}
    return { id: field.id, required: !!field.validations?.required, value, valid }
  })
}

const noDiscarding = {
  ...form,
  fields: form.fields.map(f =>
    f.kind === FieldKindEnum.THANK_YOU ? { ...f, properties: { discardSubmission: false } } : f
  )
}

async function main() {
  const problems: string[] = []
  const outcomes: Record<string, number> = {}
  let cases = 0

  for (const answers of answerMaps()) {
    for (const partial of [false, true]) {
      for (const [timing, openedAgo] of [
        ['in time', 10],
        ['time up', TIME_LIMIT + 3],
        ['too late', TIME_LIMIT + TIME_LIMIT_GRACE_SECONDS + 1]
      ] as const) {
        cases++
        const at = `${JSON.stringify(answers)} partial=${partial} ${timing}`
        const result = await submit(form, answers, partial, openedAgo)
        const steps = route(answers)
        const discardRoute = isSubmissionDiscarded(
          form as any,
          flattenFields(structuredClone(form.fields) as any, true),
          answers,
          partial
        )
        outcomes[`${timing} ${partial ? 'partial' : 'complete'} ${result.outcome}`] =
          (outcomes[`${timing} ${partial ? 'partial' : 'complete'} ${result.outcome}`] || 0) + 1

        // A discarded response is stored, counted, charged and sent nowhere
        if (result.outcome === 'discarded') {
          const { create, ip, report, integration, payment } = result.calls
          if (create + ip + report + integration + payment > 0) {
            problems.push(`discarded but side effects ran ${at}`)
          }

          // DiscardedIsValidated: the same submission without discarding endings is accepted
          const kept = await submit(noDiscarding, answers, partial, openedAgo)
          if (kept.outcome === 'rejected') problems.push(`discarded an invalid submission ${at}`)
        }

        if (result.outcome === 'stored') {
          // Counted once against the IP limit, and never on a discarding route
          if (result.calls.ip !== 1) problems.push(`stored with ${result.calls.ip} IP checks ${at}`)
          if (discardRoute) problems.push(`stored a discarding route ${at}`)

          // Before the time is up the usual rules hold: a complete submission answers every
          // required question on its route
          if (timing === 'in time' && !partial) {
            for (const step of steps) {
              if (step.required && !step.valid) problems.push(`stored without ${step.id} ${at}`)
            }
          }
        }

        // Nothing is accepted after the grace window, and a complete submission gets no grace
        if (timing === 'too late' || (timing === 'time up' && !partial)) {
          if (result.outcome !== 'rejected' || !/time limit has expired/.test(result.message!)) {
            problems.push(`accepted after the time limit ${at}`)
          }
        }

        // CountdownIsAccepted: when the time runs out, what was answered on a saving route is
        // stored, exactly the valid answers it could reach and nothing else; with none, nothing
        // is stored
        if (timing === 'time up' && partial && !discardRoute) {
          const expected = route(answers, true)
            .filter(s => s.valid)
            .map(s => [s.id, s.value])
          const got = result.stored?.answers.map((a: any) => [a.id, a.value])

          if (expected.length < 1) {
            if (result.outcome !== 'discarded' || result.calls.create + result.calls.ip > 0) {
              problems.push(`time ran out with nothing answered, yet ${result.outcome} ${at}`)
            }
          } else if (result.outcome !== 'stored') {
            problems.push(`time limit's submission ${result.outcome}: ${result.message} ${at}`)
          } else if (JSON.stringify(got) !== JSON.stringify(expected)) {
            problems.push(
              `time limit stored ${JSON.stringify(got)}, expected ${JSON.stringify(expected)} ${at}`
            )
          }
        }
      }
    }
  }

  assert.strictEqual(cases, 5 * 5 * 3 * 2 * 3)
  assert.deepStrictEqual(problems, [])
  // Not vacuous: every kind of outcome happens
  for (const key of [
    'in time complete stored',
    'in time complete rejected',
    'in time complete discarded',
    'in time partial rejected',
    'time up partial stored',
    'time up partial discarded',
    'time up complete rejected',
    'too late partial rejected'
  ]) {
    assert.ok(outcomes[key] > 0, `no case where ${key}: ${JSON.stringify(outcomes)}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
