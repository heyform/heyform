import { Answer, CHOICES_FIELD_KINDS, FormField } from '@heyform-inc/shared-types-enums'

import { helper } from '@heyform-inc/utils'

import { FieldsToValidateRules, fieldsToValidateRules } from './fields-to-validate-rules'
import { validate } from './validate'

// Validation accepts a blank "Other" on questions without "Other", so drop it before storing.
// Otherwise it would show up as "Other" or match an "Other" jump rule.
function dropBlankOther(rule: FieldsToValidateRules, value: any) {
  if (
    CHOICES_FIELD_KINDS.includes(rule.kind) &&
    value?.other === '' &&
    !(rule.allowOther && rule.allowBlankOther)
  ) {
    return { value: value.value }
  }

  return value
}

export function fieldValuesToAnswers(
  fields: FormField[],
  values: Record<string, any>,
  partialSubmission?: boolean
): Answer[] {
  const rules = fieldsToValidateRules(fields)
  const answers: Answer[] = []

  for (const rule of rules) {
    let value = values[rule.id]

    if (partialSubmission) {
      try {
        // Validate the value, if it fails, an exception will be thrown
        validate(rule, value)

        answers.push({
          id: rule.id,
          title: rule.title,
          kind: rule.kind,
          properties: rule.properties || {},
          value: dropBlankOther(rule, value)
        } as any)
      } catch (_) {}

      // Partial submission does not need to throw error
      continue
    }

    // Validate the value, if it fails, an exception will be thrown
    validate(rule, value)

    if (helper.isEmpty(value)) {
      if (CHOICES_FIELD_KINDS.includes(rule.kind)) {
        value = {
          value: []
        }
      } else {
        value = ''
      }
    }

    answers.push({
      id: rule.id,
      title: rule.title,
      kind: rule.kind,
      properties: rule.properties || {},
      value: dropBlankOther(rule, value)
    } as any)
  }

  return answers
}
