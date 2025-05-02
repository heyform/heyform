import { htmlUtils, parsePlainAnswer, validateRequiredField } from '@heyform-inc/answer-utils'
import { FORM_FIELD_KINDS, FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper, type } from '@heyform-inc/utils'

import { KeyCode } from '@/components'
import { IMapType } from '@/components'

import type { IFormField, IPartialFormField } from '../typings'

const MENTION_REGEX = /<span[^>]+data-mention="([^"]+)"([^>]+)?>[^<]+<\/span>/gi
const HIDDEN_FIELD_REGEX = /<span[^>]+data-hiddenfield="([^"]+)"([^>]+)?>[^<]+<\/span>/gi
const VARIABLE_REGEX = /<span[^>]+data-variable="([^"]+)"([^>]+)?>[^<]+<\/span>/gi

export function isNotNil(arg: any): boolean {
  return !helper.isNil(arg)
}

export function isFile(arg: any): boolean {
  return isNotNil(arg) && type(arg) === 'file'
}

export function initialValue(value: any) {
  if (helper.isValid(value)) {
    return value
  }
}

export function replaceHTML(
  html: string,
  values: IMapType,
  fields: IFormField[],
  query: IMapType,
  variables: IMapType
) {
  if (helper.isEmpty(html)) {
    return ''
  }

  // Replace mentions
  html = html.replace(MENTION_REGEX, (matched, fieldId) => {
    const value = values[fieldId]

    if (!value) {
      return matched
    }

    const field = fields.find(f => f.id === fieldId)

    if (!field) {
      return matched
    }

    const text = parsePlainAnswer(
      {
        ...field,
        value
      } as any,
      true
    )

    return `<span class="mention" data-mention="${fieldId}">${text}</span>`
  })

  // Replace hidden fields
  html = html.replace(HIDDEN_FIELD_REGEX, (matched, varId) => {
    const value = query[varId]

    if (helper.isEmpty(value)) {
      return matched
    }

    return `<span class="hiddenfield" data-variable="${varId}">${value}</span>`
  })

  // Replace variables
  html = html.replace(VARIABLE_REGEX, (matched, varId) => {
    const value = variables[varId]

    if (helper.isEmpty(value)) {
      return matched
    }

    return `<span class="variable" data-variable="${varId}">${value}</span>`
  })

  return html
}

export function parseFields(
  fields?: IFormField[],
  translations: Record<string, any> = {}
): IFormField[] {
  const result = fields?.filter(f => FORM_FIELD_KINDS.includes(f.kind))

  if (!helper.isValidArray(result)) {
    return []
  }

  return result!.map(f => {
    const translation = translations[f.id]

    // Adapt with old form structure
    const title = (translation?.title || (f as unknown as any).titleSchema || f.title) as string[]

    if (helper.isArray(title)) {
      f.title = htmlUtils.serialize(title, {
        livePreview: true
      })
    }

    const description = translation?.description || f.description

    if (helper.isArray(description)) {
      f.description = htmlUtils.serialize(description as string[], {
        livePreview: true
      })
    }

    return f
  })
}

export function flattenFieldsWithGroups(fields: IFormField[]): IFormField[] {
  let result: IFormField[] = []

  fields.forEach(f => {
    if (f.kind === FieldKindEnum.GROUP) {
      const children = parseFields(f.properties?.fields)

      if (helper.isValidArray(children)) {
        const row = {
          ...{},
          ...f,
          properties: {
            ...f.properties,
            fields: []
          }
        }

        result = [
          ...result,
          row,
          ...children.map(c => {
            c.parent = row
            return c
          })
        ]
      }
    } else {
      result.push(f)
    }
  })

  return result
}

export function sliceFieldsByLogics(fields: IFormField[], jumpFieldIds: string[]): IFormField[] {
  const index = fields.findIndex(f => jumpFieldIds.includes(f.id) && !f.isTouched)

  if (index > -1) {
    return fields.slice(0, index + 1)
  }

  return fields
}

function getPartialField(field: IFormField): IPartialFormField {
  return {
    id: field.id,
    index: field.index!,
    kind: field.kind,
    title: htmlUtils.plain(field.title as string),
    required: field.validations?.required
  }
}

export function treeFields(fields: IFormField[]): IPartialFormField[] {
  const root = fields.filter(f => helper.isNil(f.parent))
  const children: IFormField[] = fields.filter(f => isNotNil(f.parent))

  return root.map(f => {
    const row = getPartialField(f)

    if (f.kind === FieldKindEnum.GROUP) {
      row.children = children.filter(c => c.parent?.id === f.id).map(getPartialField)
    }

    return row
  })
}

export function validateLogicField(
  field: IFormField,
  jumpFieldIds: string[],
  values: any
): boolean {
  if (jumpFieldIds.includes(field.id) && !field.isTouched) {
    return validateRequiredField(field, values)
  }

  return true
}

export function progressPercentage(valueLength: number, questionCount: number) {
  if (questionCount === 0) {
    return 0
  }
  return Math.round((valueLength / questionCount) * 100)
}

function numberToChars(number: number, radix = 26): string {
  const arrays: number[] = []

  while (number > radix) {
    arrays.unshift(radix)
    number -= radix
  }

  if (number > 0) {
    arrays.unshift(number)
  }

  return arrays.map(n => String.fromCharCode(KeyCode.A + n - 1).toLowerCase()).join('')
}

export function questionNumber(number?: number | string, parentNumber?: number | string): string {
  if (number) {
    return parentNumber ? [parentNumber, numberToChars(number! as number)].join('') : String(number)
  }

  return ''
}

export function removeHeading(title?: string) {
  return (title || '').replace(/<h\d>/gi, '<span>').replace(/<\/h\d>/gi, '</span>')
}
