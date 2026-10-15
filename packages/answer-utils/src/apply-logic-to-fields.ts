import {
  ActionEnum,
  AnswerValue,
  FieldKindEnum,
  FormField,
  Logic,
  NavigateAction,
  NumberCalculateAction,
  QUESTION_FIELD_KINDS,
  StringCalculateAction,
  Variable
} from '@heyform-inc/shared-types-enums'

import { helper } from '@heyform-inc/utils'

import { calculateAction } from './calculate-action'
import { createFieldNavigation } from './navigation'
import { validateRequiredField } from './validate'
import { validateCondition } from './validate-condition'

interface IFormField extends FormField {
  parent?: FormField
  isTouched?: boolean
}

export interface PickAndCalcFieldsResult {
  fields: IFormField[]
  variables: Record<string, AnswerValue>
}

function indexFields(fields: IFormField[]) {
  const parents = fields.filter(f => !f.parent && QUESTION_FIELD_KINDS.includes(f.kind))
  const children = fields.filter(f => f.parent && QUESTION_FIELD_KINDS.includes(f.kind))

  let index = 1
  const childrenIndexes: Record<string, number> = {}

  parents.forEach(f => {
    f.index = index++
  })

  children.forEach(f => {
    const parentId = f.parent!.id
    const parent = parents.find(p => p.id === parentId)

    if (!childrenIndexes[parentId]) {
      childrenIndexes[parentId] = 1
    }

    f.parent = parent
    f.index = childrenIndexes[parentId]++
  })
}

export function applyLogicToFields(
  fields?: IFormField[],
  logics?: Logic[],
  parameters?: Variable[],
  values?: Record<string, AnswerValue>
): PickAndCalcFieldsResult {
  const result: PickAndCalcFieldsResult = {
    fields: [],
    variables: {}
  }

  if (helper.isEmpty(fields)) {
    return result
  }

  if (helper.isValid(parameters)) {
    for (const variable of parameters!) {
      result.variables[variable.id] = variable.value
    }
  }

  if (
    (helper.isEmpty(logics) || helper.isEmpty(values)) &&
    !fields!.some(field => field.nextFieldId)
  ) {
    // Add indexes to every field
    indexFields(fields!)

    return {
      ...result,
      fields: fields!.filter(f => f.kind !== FieldKindEnum.THANK_YOU)
    }
  }

  const navigation = createFieldNavigation(fields!)
  let index = 0

  while (index < fields!.length) {
    const field = fields![index]

    if (field.kind === FieldKindEnum.THANK_YOU) {
      break
    }

    let isNavigateValidated = false
    const logic = logics?.find(l => l.fieldId === field.id)

    // Add parent field if needed to present SubGroup fields
    if (field.parent && result.fields.findIndex(f => f.id === field.parent!.id) < 0) {
      result.fields.push(field.parent)
    }

    if (logic && helper.isValid(values)) {
      const { payloads } = logic
      const calculates = payloads.filter(p => p.action.kind === ActionEnum.CALCULATE)

      for (const calculate of calculates) {
        const { action, condition } = calculate
        const isValidated = validateCondition(field, condition, values)

        if (isValidated) {
          result.variables = calculateAction(
            action as NumberCalculateAction | StringCalculateAction,
            parameters,
            result.variables,
            values
          )
        }
      }

      const navigates = payloads.filter(p => p.action.kind === ActionEnum.NAVIGATE)

      // Find the first navigate which meets the jump rule
      for (const navigate of navigates) {
        const { action, condition } = navigate

        // Whether the jump logic in this field has been verified or not
        field.isTouched = validateCondition(field, condition, values)

        if (field.isTouched) {
          const jumpFieldId = (action as NavigateAction).fieldId
          const jumpIndex = navigation.indexOf(jumpFieldId)
          const isExists = !!result.fields.find(f => f.id === jumpFieldId)

          // Logic jump only works when sending the respondent forward in the form
          if (!isExists && jumpIndex > index) {
            index = jumpIndex
            isNavigateValidated = true

            result.fields.push(field)
            break
          }
        } else {
          field.isTouched = validateRequiredField(field, values)
        }
      }
    }

    if (!isNavigateValidated) {
      index = navigation.getNextIndex(index)
      result.fields.push(field)
    }
  }

  // Add indexes to every field
  indexFields(result.fields)

  return result
}
