import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

export function flattenFields(fields?: FormField[], withGroup = false): FormField[] {
  if (helper.isEmpty(fields)) {
    return []
  }

  return fields!.reduce((prev: FormField[], curr) => {
    if (curr.kind === FieldKindEnum.GROUP) {
      if (withGroup) {
        const group = {
          ...{},
          ...curr,
          properties: {
            ...curr.properties,
            fields: []
          }
        }

        return [...prev, group, ...(curr.properties?.fields || [])]
      }

      return [...prev, ...(curr.properties?.fields || [])]
    }
    return [...prev, curr]
  }, [])
}
