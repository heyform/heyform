import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  Logic,
  LogicPayload
} from '@heyform-inc/shared-types-enums'
import { describe, expect, it } from 'vitest'

import {
  countUnmappedJumps,
  fieldLogicToNodesEdges,
  getChoiceDestinations,
  getPayloadFormValues,
  toChoiceBranchPayloads
} from '../src/pages/form/Builder/utils/logic'

import type { FormFieldType } from '../src/types/form'

const role: FormFieldType = {
  id: 'role',
  title: 'Role',
  kind: FieldKindEnum.MULTIPLE_CHOICE,
  validations: { required: true },
  properties: {
    choices: [
      { id: 'motion', label: 'Motion' },
      { id: 'director', label: 'Director' }
    ]
  }
}

const fields: FormFieldType[] = [
  role,
  { id: 'motion-q', title: 'Motion', kind: FieldKindEnum.SHORT_TEXT },
  { id: 'director-q', title: 'Director', kind: FieldKindEnum.SHORT_TEXT },
  { id: 'end', title: 'Thanks', kind: FieldKindEnum.THANK_YOU }
]

function jump(id: string, expected: unknown, fieldId: string): LogicPayload {
  return {
    id,
    condition: { comparison: ComparisonEnum.IS, expected },
    action: { kind: ActionEnum.NAVIGATE, fieldId }
  } as LogicPayload
}

function roleEdges(logics: Logic[]) {
  return fieldLogicToNodesEdges(structuredClone(fields), logics)
    .edges.filter(e => e.source === 'role')
    .map(e => [e.data.kind, e.target])
}

describe('choice branching in the builder', () => {
  it('reads destinations from "is" jumps and keeps payload IDs when rebuilding them', () => {
    const previous = [jump('keep', ['motion'], 'motion-q'), jump('drop', 'gone', 'end')]

    expect(getChoiceDestinations(previous)).toEqual({ motion: 'motion-q', gone: 'end' })

    const payloads = toChoiceBranchPayloads(
      role,
      { motion: 'director-q', director: 'end' },
      previous
    )

    expect(payloads.map(p => [p.id === 'keep', p.condition, p.action])).toEqual([
      [
        true,
        { comparison: ComparisonEnum.IS, expected: 'motion' },
        jump('', '', 'director-q').action
      ],
      [false, { comparison: ComparisonEnum.IS, expected: 'director' }, jump('', '', 'end').action]
    ])
  })

  it('hides the default edge only when every answer has a destination', () => {
    const complete = [
      {
        fieldId: 'role',
        branchByAnswer: true,
        payloads: [jump('a', 'motion', 'motion-q'), jump('b', 'director', 'end')]
      }
    ]
    const partial = [
      { fieldId: 'role', branchByAnswer: true, payloads: [jump('a', 'motion', 'motion-q')] }
    ]

    expect(roleEdges(complete)).toEqual([
      ['conditional', 'motion-q'],
      ['conditional', 'end']
    ])
    expect(roleEdges(partial)).toEqual([
      ['next', 'motion-q'],
      ['conditional', 'motion-q']
    ])

    const node = fieldLogicToNodesEdges(structuredClone(fields), partial).nodes[0]
    expect(node.data).toMatchObject({ isBranching: true, hasBranchingError: true })
  })

  it('treats existing jump rules as ordinary jumps unless branching is switched on', () => {
    const logics = [{ fieldId: 'role', payloads: [jump('a', 'motion', 'motion-q')] }]

    expect(roleEdges(logics)).toEqual([
      ['next', 'motion-q'],
      ['conditional', 'motion-q']
    ])
    expect(fieldLogicToNodesEdges(structuredClone(fields), logics).nodes[0].data).toMatchObject({
      isBranching: false,
      hasBranchingError: false
    })
  })

  it('keeps jump rules in the dialog list until branching is switched on', () => {
    const payloads = [jump('a', 'motion', 'motion-q'), jump('b', 'gone', 'end')]

    expect(getPayloadFormValues(role, { fieldId: 'role', payloads })).toMatchObject({
      branching: false,
      payloads
    })
    expect(
      getPayloadFormValues(role, { fieldId: 'role', branchByAnswer: true, payloads })
    ).toMatchObject({
      branching: true,
      payloads: [],
      destinations: { motion: 'motion-q', gone: 'end' }
    })
    expect(countUnmappedJumps(role, payloads)).toBe(1)
  })
})
