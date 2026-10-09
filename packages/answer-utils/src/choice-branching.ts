import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  FormField,
  Logic,
  LogicPayload,
  NavigateAction
} from '@heyform-inc/shared-types-enums'

import { helper } from '@heyform-inc/utils'

import { createFieldNavigation } from './navigation'

export const BRANCHING_CHOICE_FIELD_KINDS = [
  FieldKindEnum.MULTIPLE_CHOICE,
  FieldKindEnum.PICTURE_CHOICE,
  FieldKindEnum.YES_NO
]

export enum ChoiceBranchingErrorCode {
  NOT_REQUIRED = 'not_required',
  ALLOW_MULTIPLE = 'allow_multiple',
  ALLOW_OTHER = 'allow_other',
  UNSUPPORTED_RULE = 'unsupported_rule',
  MISSING_DESTINATION = 'missing_destination'
}

export interface ChoiceBranchingError {
  fieldId: string
  code: ChoiceBranchingErrorCode
  choiceId?: string
}

function isNavigatePayload(payload: LogicPayload): boolean {
  return payload.action?.kind === ActionEnum.NAVIGATE
}

// Branching choice questions only use "is <option>" jumps, so each payload maps to one option.
export function getPayloadChoiceId(payload: LogicPayload): string | undefined {
  if (payload.condition?.comparison !== ComparisonEnum.IS) {
    return
  }

  const expected = (payload.condition as { expected?: unknown }).expected
  const choiceId = Array.isArray(expected) && expected.length === 1 ? expected[0] : expected

  return helper.isValid(choiceId) && !Array.isArray(choiceId) ? String(choiceId) : undefined
}

// Branching is opt-in, so existing jump rules on choice questions keep working as before.
// Once enabled, every answer must have a destination.
export function isChoiceBranchingField(field: FormField, logic?: Logic): boolean {
  return BRANCHING_CHOICE_FIELD_KINDS.includes(field.kind) && !!logic?.branchByAnswer
}

export function getChoiceBranchingErrors(
  fields: FormField[],
  logics?: Logic[]
): ChoiceBranchingError[] {
  const navigation = createFieldNavigation(fields)
  const errors: ChoiceBranchingError[] = []
  const logicsByFieldId = new Map<string, Logic>()
  for (const logic of logics || []) {
    // Preserve the first matching rule set on legacy forms with duplicate entries.
    if (!logicsByFieldId.has(logic.fieldId)) logicsByFieldId.set(logic.fieldId, logic)
  }

  for (const field of fields) {
    const logic = logicsByFieldId.get(field.id)

    if (!isChoiceBranchingField(field, logic)) {
      continue
    }

    const fieldId = field.id
    const choiceIds = (field.properties?.choices || []).map(choice => choice.id)
    const destinations = new Map<string, string>()

    if (!field.validations?.required) {
      errors.push({ fieldId, code: ChoiceBranchingErrorCode.NOT_REQUIRED })
    }

    if (field.properties?.allowMultiple) {
      errors.push({ fieldId, code: ChoiceBranchingErrorCode.ALLOW_MULTIPLE })
    }

    if (field.properties?.allowOther) {
      errors.push({ fieldId, code: ChoiceBranchingErrorCode.ALLOW_OTHER })
    }

    for (const payload of logic!.payloads.filter(isNavigatePayload)) {
      const choiceId = getPayloadChoiceId(payload)
      const targetId = (payload.action as NavigateAction).fieldId

      // Rules for deleted options can never match, so they don't affect where answers go.
      if (choiceId && !choiceIds.includes(choiceId)) {
        continue
      }

      if (!choiceId || destinations.has(choiceId)) {
        errors.push({ fieldId, code: ChoiceBranchingErrorCode.UNSUPPORTED_RULE, choiceId })
        continue
      }

      if (navigation.isValidNextFieldId(fieldId, targetId)) {
        destinations.set(choiceId, targetId)
      }
    }

    for (const choiceId of choiceIds) {
      if (!destinations.has(choiceId)) {
        errors.push({ fieldId, code: ChoiceBranchingErrorCode.MISSING_DESTINATION, choiceId })
      }
    }
  }

  return errors
}
