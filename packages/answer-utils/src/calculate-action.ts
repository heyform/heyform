import { isNumber } from './helper'
import {
  AnswerValue,
  CalculateEnum,
  NumberCalculateAction,
  StringCalculateAction,
  Variable
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

export function calculateAction(
  action: NumberCalculateAction | StringCalculateAction,
  parameters?: Variable[],
  data?: Record<string, string | number>,
  values?: Record<string, AnswerValue>
) {
  if (helper.isEmpty(parameters) || helper.isEmpty(data) || helper.isNil(data![action.variable])) {
    return data || {}
  }

  const variable = parameters!.find(v => v.id === action.variable)!
  let current = data![action.variable]

  switch (variable.kind) {
    case 'string':
      current = calculateString(current as string, action as StringCalculateAction, values)
      break

    case 'number':
      current = calculateNumber(current as number, action as NumberCalculateAction, values)
      break
  }

  return {
    ...data,
    [action.variable]: current
  }
}

function calculateString(
  value: string,
  action: StringCalculateAction,
  values?: Record<string, AnswerValue>
): string {
  let newValue = action.value as string

  if (action.ref) {
    newValue = values?.[action.ref] as string
  }

  if (!helper.isNil(newValue)) {
    switch (action.operator) {
      case CalculateEnum.ADDITION:
        return value + newValue!

      case CalculateEnum.ASSIGNMENT:
        return newValue!
    }
  }

  return value
}

function calculateNumber(
  value: number,
  action: NumberCalculateAction,
  values?: Record<string, AnswerValue>
): number {
  let newValue = action.value as number

  if (action.ref) {
    newValue = values?.[action.ref] as number
  }

  if (!helper.isNil(newValue) && isNumber(newValue!)) {
    switch (action.operator) {
      case CalculateEnum.ADDITION:
        return value + newValue!

      case CalculateEnum.SUBTRACTION:
        return value - newValue!

      case CalculateEnum.MULTIPLICATION:
        return value * newValue!

      case CalculateEnum.DIVISION:
        return newValue! !== 0 ? value / newValue! : value

      case CalculateEnum.ASSIGNMENT:
        return newValue!
    }
  }

  return value
}
