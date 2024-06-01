import { getDateFormat } from './helper'
import { htmlUtils } from './html-utils'
import {
  FieldKindEnum,
  FormField,
  Property,
  QUESTION_FIELD_KINDS,
  Validation
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

export interface FieldsToValidateRules
  extends FormField,
    Validation,
    Partial<Omit<Property, 'choices' | 'tableColumns'>> {
  title: string
  description: string
  choices?: string[]
}

export function fieldsToValidateRules(fields: FormField[]): FieldsToValidateRules[] {
  let rules: FieldsToValidateRules[] = []

  for (const field of fields) {
    if (!QUESTION_FIELD_KINDS.includes(field.kind)) {
      continue
    }

    if (field.kind === FieldKindEnum.GROUP) {
      rules = [...rules, ...(field.properties?.fields || [])?.map(field => convert(field))]
    } else {
      rules.push(convert(field))
    }
  }

  return rules
}

function convert(field: FormField): FieldsToValidateRules {
  let title = (field.title as string) || ''
  let description = (field.description as string) || ''

  if (helper.isValidArray(field.title)) {
    title = htmlUtils.serialize(field.title as unknown as any, {
      plain: true
    })
  }

  if (helper.isValidArray(field.description)) {
    description = htmlUtils.serialize(field.description as unknown as any, {
      plain: true
    })
  }

  const rule: FieldsToValidateRules = {
    id: field.id,
    kind: field.kind,
    title,
    description,
    validations: field.validations,
    properties: field.properties
  }

  // Validation FieldsToValidateRules
  if (helper.isBool(field.validations?.required)) {
    rule.required = field.validations!.required
  }

  if (
    helper.isValid(field.validations?.min) &&
    helper.isNumeric(String(field.validations?.min), { no_symbols: true })
  ) {
    rule.min = field.validations!.min
  }

  if (
    helper.isValid(field.validations?.max) &&
    helper.isNumeric(String(field.validations?.max), { no_symbols: true })
  ) {
    rule.max = field.validations!.max
  }

  // Choice
  if (helper.isBool(field.properties?.allowMultiple)) {
    rule.allowMultiple = field.properties!.allowMultiple
  }

  if (helper.isBool(field.properties?.allowOther)) {
    rule.allowOther = field.properties!.allowOther
  }

  if (helper.isValidArray(field.properties?.choices)) {
    rule.choices = field.properties!.choices!.map(choice => choice.id)
  }

  // Date format
  if (helper.isString(field.properties?.format)) {
    rule.format = getDateFormat(field.properties!.format!, field.properties?.allowTime)
  }

  // Payment
  if (helper.isNumeric(String(field.properties?.price))) {
    rule.price = field.properties!.price
  }

  // Rating, payment and opinion_scale
  if (
    helper.isValid(field.properties?.total) &&
    helper.isNumeric(String(field.properties?.total), { no_symbols: true })
  ) {
    rule.total = field.properties!.total
  }

  return rule
}
