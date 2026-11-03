import {
  ActionEnum,
  AnswerValue,
  FORM_FIELD_KINDS,
  FieldKindEnum,
  FormField,
  Logic,
  NavigateAction,
  OTHER_FIELD_KINDS,
  Variable
} from '@heyform-inc/shared-types-enums'

import { clone, helper } from '@heyform-inc/utils'

import { applyLogicToFields } from './apply-logic-to-fields'
import { validateCondition } from './validate-condition'

export function getNavigateFieldId(
  field: FormField,
  thankYouFields: FormField[] = [],
  logics?: Logic[] | null,
  variables?: Variable[] | null,
  fieldValues: Record<string, any> = {},
  variableValues: Record<string, any> = {}
) {
  if (helper.isEmpty(thankYouFields)) {
    return
  }

  const logic = logics?.find(l => l.fieldId === field.id)

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
  for (const variable of variables || []) {
    if (helper.isValidArray(variable.logics)) {
      for (const { condition, action } of variable.logics!) {
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

  if (field.nextFieldId && thankYouFields.some(f => f.id === field.nextFieldId)) {
    return field.nextFieldId
  }
}

export function sliceFieldsByLogics<T extends FormField & { isTouched?: boolean }>(
  fields: T[],
  jumpFieldIds: string[]
): T[] {
  const index = fields.findIndex(f => jumpFieldIds.includes(f.id) && !f.isTouched)

  if (index > -1) {
    return fields.slice(0, index + 1)
  }

  return fields
}

// The ending these answers lead to. The renderer shows it and the server decides from it
// whether to save, so both call this with the fields the respondent can reach, in any order.
export function resolveEnding(
  fields: FormField[] = [],
  logics?: Logic[] | null,
  variables?: Variable[] | null,
  values: Record<string, AnswerValue> = {},
  isPartialSubmission = false
): FormField | undefined {
  const thankYouFields = fields.filter(f => f.kind === FieldKindEnum.THANK_YOU)

  if (helper.isEmpty(thankYouFields)) {
    return
  }

  const questions = fields.filter(f => !OTHER_FIELD_KINDS.includes(f.kind))
  // The browser holds an unanswered question as undefined and JSON drops it on the way to the
  // server. List every question on both sides, so the two see the same answers.
  const answers = Object.fromEntries(questions.map(f => [f.id, values[f.id]]))
  const { fields: route } = applyLogicToFields(
    clone([...questions, ...thankYouFields]),
    logics ?? undefined,
    variables ?? undefined,
    answers
  )
  const jumpFieldIds = (logics || [])
    .filter(l => l.payloads.some(p => p.action.kind === ActionEnum.NAVIGATE))
    .map(l => l.fieldId)
  const submitted = isPartialSubmission ? sliceFieldsByLogics(route, jumpFieldIds) : route
  // Answers kept from a route the respondent backed out of must not choose the ending
  const submittedValues = Object.fromEntries(submitted.map(f => [f.id, answers[f.id]]))
  const { variables: variableValues } = applyLogicToFields(
    submitted,
    logics ?? undefined,
    variables ?? undefined,
    submittedValues
  )
  const lastField = submitted[submitted.length - 1]
  const fieldId =
    lastField &&
    getNavigateFieldId(
      lastField,
      thankYouFields,
      logics,
      variables,
      submittedValues,
      variableValues
    )

  return thankYouFields.find(f => f.id === fieldId) ?? thankYouFields[0]
}

// Whether these answers lead to an ending that keeps its responses out of the form.
// Forms without such an ending never evaluate it, so they can't fail or change here.
export function isSubmissionDiscarded(
  form: { fields?: FormField[]; logics?: Logic[] | null; variables?: Variable[] | null },
  flattenedFields: FormField[],
  values: Record<string, any>,
  partialSubmission = false
): boolean {
  const hasDiscardingEnding = flattenedFields.some(
    field => field.kind === FieldKindEnum.THANK_YOU && field.properties?.discardSubmission === true
  )

  if (!hasDiscardingEnding) {
    return false
  }

  // Variable rules can read answers the browser changes before sending, such as an upload's
  // URL, so the server could reach another ending than the one on screen. Current renderers
  // never send a discarded response, so leave these forms to them: at worst this keeps one.
  if (form.variables?.some(variable => variable.logics?.length)) {
    return false
  }

  // Keep to the fields the renderer shows: it drops unknown kinds and groups with no questions,
  // and decides only from top-level endings (it can't show one nested in a group)
  const topLevelIds = new Set((form.fields || []).map(field => field.id))
  const emptyGroupIds = new Set(
    (form.fields || [])
      .filter(
        field =>
          field.kind === FieldKindEnum.GROUP &&
          !field.properties?.fields?.some(child => FORM_FIELD_KINDS.includes(child.kind))
      )
      .map(field => field.id)
  )
  const visibleFields = flattenedFields.filter(
    field =>
      FORM_FIELD_KINDS.includes(field.kind) &&
      (field.kind !== FieldKindEnum.THANK_YOU || topLevelIds.has(field.id)) &&
      !emptyGroupIds.has(field.id)
  )
  const endsDiscarding = (fields: FormField[]) =>
    resolveEnding(fields, form.logics, form.variables, values, partialSubmission)?.properties
      ?.discardSubmission === true

  // The renderer may leave payment fields off the route, and that changes where it ends.
  // Discard only if the route ends the same way either way, so a mismatch keeps the response.
  return (
    endsDiscarding(visibleFields) &&
    endsDiscarding(visibleFields.filter(field => field.kind !== FieldKindEnum.PAYMENT))
  )
}
