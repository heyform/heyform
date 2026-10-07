import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  FormField,
  Logic,
  LogicPayload
} from '@heyform-inc/shared-types-enums'
import { describe, expect, test } from 'vitest'

import {
  ChoiceBranchingErrorCode,
  applyLogicToFields,
  getChoiceBranchingErrors,
  isChoiceBranchingField
} from '../src'

function role(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'role',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    validations: { required: true },
    properties: {
      choices: [
        { id: 'motion', label: 'Motion' },
        { id: 'director', label: 'Director' }
      ]
    },
    ...overrides
  }
}

function jump(id: string, expected: unknown, fieldId: string, comparison = ComparisonEnum.IS) {
  return {
    id,
    condition: { comparison, expected },
    action: { kind: ActionEnum.NAVIGATE, fieldId }
  } as LogicPayload
}

function form(field: FormField = role()): FormField[] {
  return [
    field,
    { id: 'motion-q', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'shared' },
    { id: 'director-q', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'shared', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'end', kind: FieldKindEnum.THANK_YOU }
  ]
}

const fullMapping: Logic[] = [
  {
    fieldId: 'role',
    branchByAnswer: true,
    payloads: [jump('p1', 'motion', 'motion-q'), jump('p2', ['director'], 'director-q')]
  }
]

function codes(fields: FormField[], logics: Logic[]) {
  return getChoiceBranchingErrors(fields, logics).map(e => [e.code, e.choiceId])
}

describe('choice branching', () => {
  test('only choice questions that opt in are branching', () => {
    expect(isChoiceBranchingField(role(), fullMapping[0])).toBe(true)
    expect(isChoiceBranchingField(role())).toBe(false)
    expect(isChoiceBranchingField(role(), { ...fullMapping[0], branchByAnswer: undefined })).toBe(
      false
    )
    expect(
      isChoiceBranchingField({ id: 'role', kind: FieldKindEnum.SHORT_TEXT }, fullMapping[0])
    ).toBe(false)
  })

  test('existing jump rules without branching are left alone', () => {
    const field = role({ validations: { required: false } })
    const logics = [{ fieldId: 'role', payloads: [jump('p1', 'motion', 'shared')] }]

    expect(getChoiceBranchingErrors(form(field), logics)).toEqual([])
  })

  test('a complete mapping on a required single-select question is valid', () => {
    expect(getChoiceBranchingErrors(form(), fullMapping)).toEqual([])
  })

  test('every option needs a destination', () => {
    const logics = [
      { fieldId: 'role', branchByAnswer: true, payloads: [jump('p1', 'motion', 'motion-q')] }
    ]
    expect(codes(form(), logics)).toEqual([
      [ChoiceBranchingErrorCode.MISSING_DESTINATION, 'director']
    ])
  })

  test('destinations must be later questions', () => {
    const fields = form()
    const logics = [
      {
        fieldId: 'role',
        branchByAnswer: true,
        payloads: [jump('p1', 'motion', 'motion-q'), jump('p2', 'director', 'missing')]
      }
    ]
    expect(codes(fields, logics)).toEqual([
      [ChoiceBranchingErrorCode.MISSING_DESTINATION, 'director']
    ])
  })

  test('question must be required, single-select and without Other', () => {
    const field = role({
      validations: { required: false },
      properties: { ...role().properties, allowMultiple: true, allowOther: true }
    })
    expect(codes(form(field), fullMapping)).toEqual([
      [ChoiceBranchingErrorCode.NOT_REQUIRED, undefined],
      [ChoiceBranchingErrorCode.ALLOW_MULTIPLE, undefined],
      [ChoiceBranchingErrorCode.ALLOW_OTHER, undefined]
    ])
  })

  test('rules that are not one-option "is" jumps are rejected', () => {
    const logics = [
      {
        ...fullMapping[0],
        payloads: [
          ...fullMapping[0].payloads,
          jump('p3', 'motion', 'shared'),
          jump('p4', 'motion', 'shared', ComparisonEnum.IS_NOT)
        ]
      }
    ]
    expect(codes(form(), logics)).toEqual([
      [ChoiceBranchingErrorCode.UNSUPPORTED_RULE, 'motion'],
      [ChoiceBranchingErrorCode.UNSUPPORTED_RULE, undefined]
    ])
  })

  test('rules for deleted options are ignored', () => {
    const logics = [
      { ...fullMapping[0], payloads: [...fullMapping[0].payloads, jump('p3', 'gone', 'shared')] }
    ]
    expect(getChoiceBranchingErrors(form(), logics)).toEqual([])
  })

  test('a valid mapping never reaches the default next question', () => {
    const fields = form(role({ nextFieldId: 'shared' }))

    for (const [choice, expected] of [
      ['motion', ['role', 'motion-q', 'shared']],
      ['director', ['role', 'director-q', 'shared']]
    ] as const) {
      const result = applyLogicToFields(structuredClone(fields), fullMapping, [], {
        role: { value: [choice] }
      } as any)
      expect(result.fields.map(f => f.id)).toEqual(expected)
    }
  })
})
