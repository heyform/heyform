import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'

// Reuse this index for all navigation decisions on one flattened field revision.
export function createFieldNavigation(fields: FormField[]) {
  const indexes = new Map<string, number>()
  fields.forEach((field, index) => {
    // Match findIndex for stale forms containing duplicate IDs.
    if (!indexes.has(field.id)) indexes.set(field.id, index)
  })

  function isValidDestination(index: number, nextIndex: number): boolean {
    return (
      index >= 0 &&
      nextIndex > index &&
      ![FieldKindEnum.WELCOME, FieldKindEnum.GROUP, FieldKindEnum.THANK_YOU].includes(
        fields[index].kind
      ) &&
      fields[nextIndex].kind !== FieldKindEnum.WELCOME
    )
  }

  function indexOf(fieldId: string): number {
    return indexes.get(fieldId) ?? -1
  }

  function isValidNextFieldId(fieldId: string, nextFieldId: string): boolean {
    return isValidDestination(indexOf(fieldId), indexOf(nextFieldId))
  }

  function getNextIndex(index: number): number {
    const field = fields[index]
    if (!field || field.kind === FieldKindEnum.THANK_YOU) return fields.length
    const nextIndex = field.nextFieldId ? indexOf(field.nextFieldId) : -1
    // Always advance from the actual position, even when IDs are duplicated.
    return isValidDestination(index, nextIndex) ? nextIndex : index + 1
  }

  function getNextFieldId(fieldId: string): string | undefined {
    return fields[getNextIndex(indexOf(fieldId))]?.id
  }

  return { indexOf, isValidNextFieldId, getNextIndex, getNextFieldId }
}

export function isValidNextFieldId(
  fields: FormField[],
  fieldId: string,
  nextFieldId: string
): boolean {
  return createFieldNavigation(fields).isValidNextFieldId(fieldId, nextFieldId)
}

export function getNextFieldId(fields: FormField[], fieldId: string): string | undefined {
  return createFieldNavigation(fields).getNextFieldId(fieldId)
}
