import {
  isAfterDate,
  isBeforeDate,
  isContains,
  isEndsWith,
  isEqual,
  isGreaterOrEqualThan,
  isGreaterThan,
  isLessOrEqualThan,
  isLessThan,
  isSameDate,
  isStartsWith
} from './helper'
import {
  AnswerValue,
  ChoiceValue,
  ComparisonEnum,
  FieldKindEnum,
  FormField,
  LogicCondition,
  STATEMENT_FIELD_KINDS,
  TextCondition
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

const NO_LOGIC_FIELD_KINDS = [...STATEMENT_FIELD_KINDS, FieldKindEnum.GROUP]

export function validateCondition(
  field: FormField,
  condition: LogicCondition,
  values?: Record<string, AnswerValue>
): boolean {
  switch (field.kind) {
    case FieldKindEnum.SHORT_TEXT:
    case FieldKindEnum.LONG_TEXT:
    case FieldKindEnum.PHONE_NUMBER:
    case FieldKindEnum.EMAIL:
    case FieldKindEnum.URL:
      return validateText(field, condition, values)

    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      return validateChoice(field, condition, values)

    case FieldKindEnum.YES_NO:
    case FieldKindEnum.LEGAL_TERMS:
      return validateBoolean(field, condition, values)

    case FieldKindEnum.DATE:
      return validateDate(field, condition, values)

    case FieldKindEnum.NUMBER:
    case FieldKindEnum.RATING:
    case FieldKindEnum.OPINION_SCALE:
      return validateNumber(field, condition, values)

    default:
      return validateDefault(field, condition, values)
  }
}

function validateText(
  field: FormField,
  condition: LogicCondition,
  values?: Record<string, AnswerValue>
) {
  const value = values?.[field.id]
  const { expected } = condition as TextCondition

  switch (condition.comparison) {
    case ComparisonEnum.IS:
      return isEqual(value, expected)

    case ComparisonEnum.IS_NOT:
      return !isEqual(value, expected)

    case ComparisonEnum.CONTAINS:
      return isContains(value, expected)

    case ComparisonEnum.DOES_NOT_CONTAIN:
      return !isContains(value, expected)

    case ComparisonEnum.STARTS_WITH:
      return isStartsWith(value, expected)

    case ComparisonEnum.ENDS_WITH:
      return isEndsWith(value, expected)
  }

  return false
}

function validateChoice(
  field: FormField,
  condition: LogicCondition,
  values?: Record<string, AnswerValue>
) {
  const rawValue = values?.[field.id] as ChoiceValue
  const { expected: rawExpected } = condition as TextCondition
  const expected = helper.isArray(rawExpected) ? rawExpected : [rawExpected]
  const value = [...(rawValue?.value || []), rawValue?.other].filter(helper.isValid)

  switch (condition.comparison) {
    case ComparisonEnum.IS:
      return isEqual(value, expected)

    case ComparisonEnum.IS_NOT:
      return !isEqual(value, expected)

    case ComparisonEnum.CONTAINS:
      return isContains(value, expected)

    case ComparisonEnum.DOES_NOT_CONTAIN:
      return !isContains(value, expected)
  }

  return false
}

function validateBoolean(
  field: FormField,
  condition: LogicCondition,
  values?: Record<string, AnswerValue>
) {
  const value = values?.[field.id]
  const { expected } = condition as TextCondition

  switch (condition.comparison) {
    case ComparisonEnum.IS:
      return isEqual(value, expected)

    case ComparisonEnum.IS_NOT:
      return !isEqual(value, expected)
  }

  return false
}

function validateNumber(
  field: FormField,
  condition: LogicCondition,
  values?: Record<string, AnswerValue>
) {
  const value = values?.[field.id]
  const { expected } = condition as TextCondition

  switch (condition.comparison) {
    case ComparisonEnum.EQUAL:
      return isEqual(value, expected)

    case ComparisonEnum.NOT_EQUAL:
      return !isEqual(value, expected)

    case ComparisonEnum.GREATER_THAN:
      return isGreaterThan(value, expected)

    case ComparisonEnum.LESS_THAN:
      return isLessThan(value, expected)

    case ComparisonEnum.GREATER_OR_EQUAL_THAN:
      return isGreaterOrEqualThan(value, expected)

    case ComparisonEnum.LESS_OR_EQUAL_THAN:
      return isLessOrEqualThan(value, expected)
  }

  return false
}

function validateDate(
  field: FormField,
  condition: LogicCondition,
  values?: Record<string, AnswerValue>
) {
  const value = values?.[field.id]
  const { expected } = condition as TextCondition

  switch (condition.comparison) {
    case ComparisonEnum.IS:
      return isSameDate(
        value,
        expected as string,
        field.properties?.format,
        field.properties?.allowTime
      )

    case ComparisonEnum.IS_NOT:
      return !isSameDate(
        value,
        expected as string,
        field.properties?.format,
        field.properties?.allowTime
      )

    case ComparisonEnum.IS_BEFORE:
      return isBeforeDate(
        value,
        expected as string,
        field.properties?.format,
        field.properties?.allowTime
      )

    case ComparisonEnum.IS_AFTER:
      return isAfterDate(
        value,
        expected as string,
        field.properties?.format,
        field.properties?.allowTime
      )
  }

  return false
}

function validateDefault(
  field: FormField,
  condition: LogicCondition,
  values?: Record<string, AnswerValue>
) {
  if (NO_LOGIC_FIELD_KINDS.includes(field.kind)) {
    return false
  }

  const value = values?.[field.id]

  switch (condition.comparison) {
    case ComparisonEnum.IS_EMPTY:
      return helper.isEmpty(value)

    case ComparisonEnum.IS_NOT_EMPTY:
      return !helper.isEmpty(value)

    default:
      return false
  }
}
