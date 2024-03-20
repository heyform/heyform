import { ActionEnum, ComparisonEnum, LogicPayload } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

const OTHER_COMPARISONS = [ComparisonEnum.IS_EMPTY, ComparisonEnum.IS_NOT_EMPTY]

export function validatePayload(payload: LogicPayload): boolean {
  if (
    !payload.action.kind ||
    (!OTHER_COMPARISONS.includes(payload.condition.comparison) &&
      helper.isEmpty((payload.condition as any).expected))
  ) {
    return false
  }

  if (payload.action.kind === ActionEnum.NAVIGATE) {
    return helper.isValid(payload.action.fieldId)
  }

  return (
    helper.isValid(payload.action.variable) &&
    helper.isValid(payload.action.operator) &&
    helper.isValid(payload.action.value)
  )
}
