import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { describe, expect, it, vi } from 'vitest'

import { flattenFields, getNextFieldId } from '@heyform-inc/answer-utils'

import { duplicateField, setFields } from '../src/pages/form/Builder/store/actions'
import { storeReducer } from '../src/pages/form/Builder/store/context'
import type { IState } from '../src/pages/form/Builder/store/context'
import type { FormFieldType } from '../src/types/form'

// Duplication is local to the builder; importing actions must not initialize API clients.
vi.mock('@/services', () => ({ FormService: {} }))

function question(id: string, nextFieldId?: string): FormFieldType {
  return { id, title: id, kind: FieldKindEnum.SHORT_TEXT, nextFieldId }
}

function group(children: FormFieldType[]): FormFieldType {
  return {
    id: 'group',
    title: 'Group',
    kind: FieldKindEnum.GROUP,
    properties: { fields: children }
  }
}

function stateFor(fields: FormFieldType[], currentId: string): IState {
  return {
    ...setFields(
      {
        formId: 'form',
        locale: 'en',
        version: 1,
        fields: [],
        questions: [],
        references: [],
        hiddenFields: []
      },
      { fields }
    ),
    currentId
  }
}

describe('duplicateField', () => {
  it('does not autosave when a destination is already absent', () => {
    const state = stateFor([question('a'), question('b')], 'a')
    delete state.fields[0].nextFieldId
    expect(storeReducer(state, { type: 'setNextField', payload: { fieldId: 'a' } })).toBe(state)
    const connected = storeReducer(state, {
      type: 'setNextField',
      payload: { fieldId: 'a', nextFieldId: 'b' }
    })
    expect(connected.fields[0].nextFieldId).toBe('b')
    expect(connected.version).toBe(state.version + 1)
    const cleared = storeReducer(connected, { type: 'setNextField', payload: { fieldId: 'a' } })
    expect(cleared.fields[0].nextFieldId).toBeUndefined()
    expect(cleared.version).toBe(connected.version + 1)
  })
  it('keeps internal branches inside the copied group and preserves external destinations', () => {
    const original = stateFor(
      [
        group([question('a', 'c'), question('b', 'external'), question('c', 'ending')]),
        question('external'),
        { id: 'ending', kind: FieldKindEnum.THANK_YOU }
      ],
      'group'
    )
    const before = structuredClone(original)

    const result = duplicateField(original, { id: 'group' })
    const copy = result.fields[1]
    const copiedChildren = copy.properties!.fields!
    const [copiedA, copiedB, copiedC] = copiedChildren

    expect(copy.id).not.toBe('group')
    const ids = [copy.id, ...copiedChildren.map(field => field.id)]
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(id => !['group', 'a', 'b', 'c'].includes(id))).toBe(true)
    expect(copiedA.nextFieldId).toBe(copiedC.id)
    expect(copiedB.nextFieldId).toBe('external')
    expect(copiedC.nextFieldId).toBe('ending')
    expect(getNextFieldId(flattenFields(result.fields, true), copiedA.id)).toBe(copiedC.id)
    expect(result.fields[0]).toEqual(before.fields[0])
    expect(original).toEqual(before)
    expect(result.currentId).toBe(copy.id)
    expect(result.currentField).toBe(copy)
  })

  it('duplicates a group with default sequential navigation', () => {
    const original = stateFor(
      [group([question('a'), question('b')]), question('external')],
      'group'
    )

    const result = duplicateField(original, { id: 'group' })
    const [copiedA, copiedB] = result.fields[1].properties!.fields!
    const flattened = flattenFields(result.fields, true)

    expect(copiedA.nextFieldId).toBeUndefined()
    expect(copiedB.nextFieldId).toBeUndefined()
    expect(getNextFieldId(flattened, copiedA.id)).toBe(copiedB.id)
    expect(getNextFieldId(flattened, copiedB.id)).toBe('external')
  })

  it('preserves a standalone question destination when duplicating it', () => {
    const original = stateFor([question('a', 'c'), question('b'), question('c')], 'a')
    const before = structuredClone(original)

    const result = duplicateField(original, { id: 'a' })
    const copy = result.fields[1]

    expect(copy.id).not.toBe('a')
    expect(copy.nextFieldId).toBe('c')
    expect(getNextFieldId(flattenFields(result.fields, true), copy.id)).toBe('c')
    expect(original).toEqual(before)
  })

  it.each(['a', 'b', 'missing'])('still removes the invalid copied destination %s', nextFieldId => {
    const original = stateFor(
      [group([question('a'), question('b')]), question('external')],
      'group'
    )
    // Simulate stale editor data: normal setFields initialization would already remove this link.
    original.fields[0].properties!.fields![1].nextFieldId = nextFieldId

    const result = duplicateField(original, { id: 'group' })
    const copiedB = result.fields[1].properties!.fields![1]

    expect(copiedB.nextFieldId).toBeUndefined()
    expect(getNextFieldId(flattenFields(result.fields, true), copiedB.id)).toBe('external')
  })
})
