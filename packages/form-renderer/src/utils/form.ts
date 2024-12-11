import {
  htmlUtils,
  parsePlainAnswer,
  validateCondition,
  validateRequiredField
} from '@heyform-inc/answer-utils'
import {
  ActionEnum,
  ChoiceBadgeEnum,
  FORM_FIELD_KINDS,
  FieldKindEnum,
  FormField,
  Logic,
  NavigateAction,
  Variable
} from '@heyform-inc/shared-types-enums'
import { helper, type } from '@heyform-inc/utils'

import { CHAR_A_KEY_CODE } from '../consts'
import type { AnyMap, IFormField, IPartialFormField } from '../typings'

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
  values: AnyMap,
  fields: IFormField[],
  query: AnyMap,
  variables: AnyMap
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

export function numberToChar(number: number, radix = 26): string {
  const arrays: number[] = []

  while (number > radix) {
    arrays.unshift(radix)
    number -= radix
  }

  if (number > 0) {
    arrays.unshift(number)
  }

  return arrays.map(n => String.fromCharCode(CHAR_A_KEY_CODE + n - 1).toLowerCase()).join('')
}

export function questionNumber(number?: number | string, parentNumber?: number | string): string {
  if (number) {
    return parentNumber ? [parentNumber, numberToChar(number! as number)].join('') : String(number)
  }

  return ''
}

export function removeHeading(title?: string) {
  return (title || '').replace(/<h\d>/gi, '<span>').replace(/<\/h\d>/gi, '</span>')
}

export function getNavigateFieldId(
  field: FormField,
  thankYouFields: FormField[] = [],
  logics: Logic[] = [],
  variables: Variable[] = [],
  fieldValues: Record<string, any> = {},
  variableValues: Record<string, any> = {}
) {
  if (helper.isEmpty(thankYouFields)) {
    return
  }

  const logic = logics.find(l => l.fieldId === field.id)

  if (logic) {
    const { payloads } = logic
    const result = payloads.filter(p => p.action.kind === ActionEnum.NAVIGATE)

    for (const payload of result) {
      const { condition, action } = payload
      const isValidated = validateCondition(field, condition, fieldValues)

      if (isValidated) {
        const { fieldId } = action as NavigateAction
        const index = thankYouFields.findIndex(f => f.id === fieldId)

        if (index > -1) {
          return fieldId
        }
      }
    }
  }

  // Check variables
  for (const variable of variables) {
    if (helper.isValidArray(variable.logics)) {
      for (const { condition, action } of variable.logics) {
        const _field: any = {
          id: variable.id,
          kind: variable.kind === 'number' ? FieldKindEnum.NUMBER : FieldKindEnum.SHORT_TEXT
        }

        const isValidated = validateCondition(_field, condition, variableValues)

        if (isValidated) {
          const { fieldId } = action as NavigateAction
          const index = thankYouFields.findIndex(f => f.id === fieldId)

          if (index > -1) {
            return fieldId
          }
        }
      }
    }
  }
}

export function getChoiceKeyName(badge: ChoiceBadgeEnum, index: number) {
  if (badge === ChoiceBadgeEnum.NUMBER) {
    return String(index + 1)
  }

  if (index >= 26) {
    const prefix = String.fromCharCode(CHAR_A_KEY_CODE + Math.floor((index - 26) / 10))
    const suffix = (index - 26) % 10

    return `${prefix}${suffix}`
  } else {
    return String.fromCharCode(CHAR_A_KEY_CODE + index)
  }
}
