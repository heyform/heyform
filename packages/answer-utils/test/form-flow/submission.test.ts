// What the server stores, checked over every answer map instead of a handful of examples.
// Replaces FormFlow.tla's Flow_*, Answer_* and Var_* invariants (MCFlow, MCAttack, MCStrict,
// MCTypeHole): the server's route is applyLogicToFields over flattenFields(form.fields, true)
// and its answers come from fieldValuesToAnswers, exactly as in completeSubmission.
import {
  CHOICES_FIELD_KINDS,
  FieldKindEnum,
  QUESTION_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { clone, helper } from '@heyform-inc/utils'

import {
  ValidateError,
  applyLogicToFields,
  fieldValuesToAnswers,
  fieldsToValidateRules,
  flattenFields
} from '../../src'
import {
  AnyValues,
  AttackForm,
  FlowForm,
  FlowValues,
  StoredTypes,
  type TestForm,
  answerMaps,
  typeOf
} from './fixtures'

interface Submission {
  route: string[]
  answers?: any[]
  variables: Record<string, unknown>
  error?: unknown
}

// completeSubmission, minus the services
function submit(form: TestForm, values: Record<string, unknown>): Submission {
  const flattened = flattenFields(clone(form.fields), true)
  const { fields, variables } = applyLogicToFields(
    flattened,
    form.logics,
    form.variables,
    values as any
  )
  const route = fields.map(f => f.id)

  try {
    return { route, variables, answers: fieldValuesToAnswers(fields, values) }
  } catch (error) {
    return { route, variables, error }
  }
}

// Every property a stored submission must have; returns what broke
function violations(form: TestForm, values: Record<string, unknown>): string[] {
  const result: string[] = []
  const order = flattenFields(form.fields, true).map(f => f.id)
  const byId = new Map(flattenFields(form.fields, true).map(f => [f.id, f]))
  const { route, answers, variables, error } = submit(form, values)
  const position = route.map(id => order.indexOf(id))

  // Flow_ForwardOnly / Flow_NoTerminalVisit
  if (position.some((p, i) => i > 0 && p <= position[i - 1])) result.push('route goes backwards')
  if (route.some(id => byId.get(id)?.kind === FieldKindEnum.THANK_YOU))
    result.push('route visits an ending')

  // Var_Typed
  for (const variable of form.variables) {
    const value = variables[variable.id]
    const ok = variable.kind === 'number' ? Number.isFinite(value) : typeof value === 'string'
    if (!ok) result.push(`variable ${variable.id} became ${typeOf(value)} ${String(value)}`)
  }

  if (error) {
    // A malformed answer is a 400 with a message, never a crash
    if (!(error instanceof ValidateError)) result.push(`validation threw ${String(error)}`)
    return result
  }

  const questions = fieldsToValidateRules(route.map(id => byId.get(id)!)).map(rule => rule.id)

  // Answer_FollowsWalk / Answer_IdsUnique / Answer_NoStatementAnswers
  if (JSON.stringify(answers!.map(a => a.id)) !== JSON.stringify(questions)) {
    result.push(`answers ${answers!.map(a => a.id)} are not the route's questions ${questions}`)
  }

  for (const answer of answers!) {
    const field = byId.get(answer.id)!
    const stored = JSON.parse(JSON.stringify({ value: answer.value ?? null })).value

    // Answer_KindMatchesField / Answer_NoStatementAnswers
    if (answer.kind !== field.kind || !QUESTION_FIELD_KINDS.includes(answer.kind)) {
      result.push(`${answer.id}: stored as ${answer.kind}`)
    }

    // Answer_TypeSafe: the shape the submissions table and the exports expect
    const allowed = StoredTypes[field.kind] ?? ['string']
    if (!allowed.includes(typeOf(stored))) result.push(`${field.kind} stored as ${typeOf(stored)}`)

    // Numbers may be numeric text, never other text; ratings are whole numbers in range
    if (allowed.includes('number') && stored !== '') {
      if (!helper.isNumeric(stored))
        result.push(`${field.kind} stored as non-numeric ${JSON.stringify(stored)}`)

      const total = field.properties?.total
      const n = Number(stored)
      if (total && (!Number.isInteger(n) || n < 1 || n > total)) {
        result.push(`${field.kind} stored out of range: ${JSON.stringify(stored)}`)
      }
    }

    // Answer_RequiredAnswered
    if (field.validations?.required && helper.isEmpty(stored))
      result.push(`${answer.id}: required but empty`)

    // Answer_ChoiceSound
    if (CHOICES_FIELD_KINDS.includes(field.kind) && helper.isObject(stored)) {
      const ids = (field.properties?.choices || []).map(c => c.id)
      const selected: unknown[] = helper.isArray(stored.value) ? stored.value : []
      const hasOther = typeof stored.other === 'string'

      if (selected.some(id => !ids.includes(id as string)))
        result.push(`${answer.id}: unknown choice`)
      if (hasOther && !field.properties?.allowOther)
        result.push(`${answer.id}: "Other" not allowed`)
      if (!field.properties?.allowMultiple && selected.length + (hasOther ? 1 : 0) > 1) {
        result.push(`${answer.id}: several answers to a single-answer question`)
      }
    }
  }

  return result
}

function collect(form: TestForm, maps: Iterable<Record<string, unknown>>) {
  const found = new Map<string, Record<string, unknown>>()
  let count = 0

  for (const values of maps) {
    count++
    for (const v of violations(form, values)) if (!found.has(v)) found.set(v, values)
  }

  return { count, found: [...found].map(([v, values]) => `${v} <- ${JSON.stringify(values)}`) }
}

test('every answer map on the flow form stores a well-formed submission', () => {
  const { count, found } = collect(FlowForm, answerMaps(FlowValues))

  expect(count).toBe(6 * 5 * 7 * 6 * 7)
  expect(found).toEqual([])
})

test("any value sent for any field stores its kind's shape or is rejected", () => {
  // AttackForm's questions have no logic, so each one can be checked on its own
  const ids = AttackForm.fields.filter(f => f.kind !== FieldKindEnum.THANK_YOU).map(f => f.id)
  const maps = ids.flatMap(id => AnyValues.map(value => ({ [id]: value })))
  const { count, found } = collect(AttackForm, maps)

  expect(count).toBe(ids.length * AnyValues.length)
  expect(found).toEqual([])
})

test('the route only depends on the answers before each jump', () => {
  // Changing an answer can only change the route after that question
  const routes = new Map<string, string>()

  for (const values of answerMaps(FlowValues)) {
    const { route } = submit(FlowForm, values)
    for (let i = 0; i < route.length; i++) {
      const prefix = JSON.stringify(route.slice(0, i).map(id => [id, values[id] ?? null]))
      const next = route[i]
      const seen = routes.get(prefix)

      expect(seen === undefined || seen === next, `${prefix} -> ${seen} or ${next}`).toBe(true)
      routes.set(prefix, next)
    }
  }
})

test('known gap: an unanswered optional question is stored as "" whatever its kind', () => {
  // Answer_StrictlyTyped (MCStrict). The submissions table guards every such shape; anything
  // else reading answers has to as well. When this is fixed, flip the expectation.
  const answers = fieldValuesToAnswers(AttackForm.fields, {})
  const blank = answers.filter(a => a.value === '').map(a => a.kind)

  expect(blank).toEqual(
    expect.arrayContaining([
      FieldKindEnum.NUMBER,
      FieldKindEnum.DATE_RANGE,
      FieldKindEnum.FULL_NAME,
      FieldKindEnum.INPUT_TABLE
    ])
  )
  expect(answers.find(a => a.kind === FieldKindEnum.MULTIPLE_CHOICE)?.value).toEqual({ value: [] })
})
