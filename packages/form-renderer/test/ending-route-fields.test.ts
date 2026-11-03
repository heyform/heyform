import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  type FormField
} from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { flattenFieldsWithGroups, getEndingRouteFields } from '../src/utils'
import { resolveEnding } from '@heyform-inc/answer-utils'

const question = (id: string): FormField => ({ id, kind: FieldKindEnum.SHORT_TEXT, title: id })
const ending = (id: string, discardSubmission = false): FormField => ({
  id,
  kind: FieldKindEnum.THANK_YOU,
  title: id,
  properties: { discardSubmission }
})

// q1, ok, later (discarding), group { nested (discarding) }: only reachable through stored data,
// the builder keeps endings out of groups.
const fields: FormField[] = [
  question('q1'),
  ending('ok'),
  ending('later', true),
  {
    id: 'g',
    kind: FieldKindEnum.GROUP,
    title: 'g',
    properties: { fields: [ending('nested', true)] }
  }
]
const logics = [
  {
    fieldId: 'q1',
    payloads: [
      {
        id: 'p1',
        condition: { comparison: ComparisonEnum.IS, expected: 'no' },
        action: { kind: ActionEnum.NAVIGATE, fieldId: 'later' }
      }
    ]
  }
]

// What Renderer.tsx initStore builds
const thankYouFields = fields.filter(f => f.kind === FieldKindEnum.THANK_YOU)
const allFields = flattenFieldsWithGroups(
  fields.filter(f => ![FieldKindEnum.WELCOME, FieldKindEnum.THANK_YOU].includes(f.kind))
)

test('the fallback ending is the first top-level ending, not one nested in a group', () => {
  expect(allFields.map(f => f.id)).toContain('nested')

  const route = getEndingRouteFields(allFields, thankYouFields)

  expect(resolveEnding(route, logics, [], { q1: 'yes' })?.id).toBe('ok')
  expect(resolveEnding(route, logics, [], {})?.id).toBe('ok')
  expect(resolveEnding(route, logics, [], { q1: 'no' })?.id).toBe('later')
})
