import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'

export function isValidNextFieldId(
  fields: FormField[],
  fieldId: string,
  nextFieldId: string
): boolean {
  const index = fields.findIndex(field => field.id === fieldId)
  const nextIndex = fields.findIndex(field => field.id === nextFieldId)

  return (
    index >= 0 &&
    nextIndex > index &&
    ![FieldKindEnum.WELCOME, FieldKindEnum.GROUP, FieldKindEnum.THANK_YOU].includes(
      fields[index].kind
    ) &&
    fields[nextIndex].kind !== FieldKindEnum.WELCOME
  )
}

export function getNextFieldId(fields: FormField[], fieldId: string): string | undefined {
  const index = fields.findIndex(field => field.id === fieldId)
  const field = fields[index]

  if (!field || field.kind === FieldKindEnum.THANK_YOU) {
    return
  }

  if (field.nextFieldId && isValidNextFieldId(fields, fieldId, field.nextFieldId)) {
    return field.nextFieldId
  }

  return fields[index + 1]?.id
}
