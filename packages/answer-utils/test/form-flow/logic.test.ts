// Properties of a form's logic, checked against the real navigation and condition code.
// Replaces FormFlow.tla's Config_* invariants (MCFlow, MCBroken, MCBrokenRule); the same
// checks after a builder type switch live in packages/webapp/test/form-flow-drift.test.ts.
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { BrokenForm, FlowForm, FlowValues, type TestForm, logicProblems } from './fixtures'

test('the flow form has no dead rule, no stray jump and full branch coverage', () => {
  expect(logicProblems(FlowForm, FlowValues)).toEqual([])
})

test('a jump to a missing field and a rule that can never fire are both reported', () => {
  expect(logicProblems(BrokenForm, FlowValues)).toEqual([
    'q2: jump to q9 is not ahead of it',
    'q3: rule nav-q5-y can never fire'
  ])
})

test('a branching question must be required and cover every choice', () => {
  const form: TestForm = {
    ...FlowForm,
    fields: FlowForm.fields.map(f =>
      f.id === 'q3' ? { ...f, validations: { required: false } } : f
    ),
    logics: FlowForm.logics.map(l =>
      l.fieldId === 'q3' ? { ...l, payloads: l.payloads.slice(0, 1) } : l
    )
  }

  expect(logicProblems(form, FlowValues).length).toBeGreaterThan(0)
  expect(form.fields.find(f => f.id === 'q3')?.kind).toBe(FieldKindEnum.YES_NO)
})
