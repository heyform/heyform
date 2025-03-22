import { htmlUtils } from '@heyform-inc/answer-utils'
import {
  FieldKindEnum,
  HiddenField,
  type Logic,
  QUESTION_FIELD_KINDS,
  type Variable
} from '@heyform-inc/shared-types-enums'
import { clone, helper, nanoid } from '@heyform-inc/utils'

import { FormService } from '@/services'
import { FormFieldType } from '@/types'

import { getValidLogics, serializeFields } from '../utils'
import {
  AddFieldAction,
  DeleteFieldAction,
  DeleteHiddenFieldAction,
  DeleteLogicAction,
  DeleteVariableAction,
  DuplicateFieldAction,
  IState,
  SelectFieldAction,
  SelectHiddenFieldAction,
  SelectVariableAction,
  SetActiveDesignTabNameAction,
  SetActiveTabNameAction,
  SetFieldsAction,
  SetSyncingAction,
  UpdateFieldAction,
  UpdateNestFieldsAction,
  UpdateVariableAction
} from './context'

function fieldIndex(fields?: FormFieldType[], id?: string): number {
  if (!helper.isValidArray(fields) || helper.isEmpty(id)) {
    return -1
  }

  return fields!.findIndex(f => f.id === id!)
}

function addFieldToGroup(field: FormFieldType, groupLike?: FormFieldType, currentId?: string) {
  if (groupLike) {
    const nestedFields = groupLike.properties?.fields || []
    const index = fieldIndex(groupLike.properties?.fields, currentId)

    // Insert new field
    nestedFields.splice(index + 1, 0, field)

    groupLike.properties = {
      ...groupLike.properties,
      fields: nestedFields
    }
  }
}

export function setFields(
  state: IState,
  { fields: rawFields }: SetFieldsAction['payload']
): IState {
  const { fields, questions } = serializeFields(rawFields)

  return {
    ...state,
    fields,
    questions
  }
}

export function selectField(
  state: IState,
  { id: currentId, parentId }: SelectFieldAction['payload']
): IState {
  let currentField: FormFieldType | undefined
  let parentField: FormFieldType | undefined

  if (parentId) {
    parentField = state.fields.find(field => field.id === parentId)

    if (parentField) {
      const index = fieldIndex(parentField.properties?.fields, currentId)

      if (index > -1) {
        currentField = parentField.properties!.fields![index]
      } else {
        currentField = parentField
        parentField = undefined
      }
    }
  } else {
    currentField = state.fields.find(f => f.id === currentId)
  }

  const index = state.questions.findIndex(q => q.id === currentId)
  const references = index < 1 ? state.questions : state.questions.slice(0, index)

  return {
    ...state,
    currentId,
    parentId,
    currentField,
    parentField,
    references
  }
}

export function addField(
  state: IState,
  { field, parentId: rawParentId }: AddFieldAction['payload']
): IState {
  const fields = clone(state.fields)
  let parentId = rawParentId || state.parentId

  if (parentId) {
    const index = fields.findIndex(f => f.id === parentId)

    switch (field.kind) {
      case FieldKindEnum.WELCOME:
        fields.splice(-1, 0, field)
        break

      case FieldKindEnum.THANK_YOU:
        fields.splice(fields.length - 1, 0, field)
        break

      case FieldKindEnum.GROUP:
        fields.splice(index + 1, 0, field)
        break

      default:
        addFieldToGroup(field, fields[index], state.currentId)
    }
  } else {
    let index = fields.findIndex(f => f.kind === FieldKindEnum.THANK_YOU)
    let selected: FormFieldType | undefined

    if (helper.isValid(state.currentId)) {
      index = fields.findIndex(f => f.id === state.currentId)
      selected = fields[index]

      if (field.kind === FieldKindEnum.THANK_YOU) {
        index = selected?.kind === FieldKindEnum.THANK_YOU ? index + 1 : fields.length
      } else {
        index = selected?.kind === FieldKindEnum.WELCOME ? 0 : index + 1
      }
    }

    if (selected?.kind === FieldKindEnum.GROUP && field.kind !== FieldKindEnum.GROUP) {
      addFieldToGroup(field, selected)
      parentId = selected.id
    } else {
      fields.splice(index, 0, field)
    }
  }

  // Reset fields
  const newState = setFields(state, { fields })

  // Select new field
  return selectField(newState, {
    id: field.id,
    parentId
  })
}

export function duplicateField(
  state: IState,
  { id, parentId }: DuplicateFieldAction['payload']
): IState {
  let field: FormFieldType | undefined

  if (parentId) {
    const parentField = state.fields.find(f => f.id === parentId)
    field = parentField?.properties?.fields?.find(c => c.id === id)
  } else {
    field = state.fields.find(f => f.id === id)
  }

  if (!field) {
    return state
  }

  // Clone field to void change original field
  field = clone(field)

  if (field.kind === FieldKindEnum.GROUP) {
    field.properties = {
      ...field.properties,
      fields: (field.properties?.fields || []).map(f => ({
        ...f,
        id: nanoid(12)
      }))
    }
  }

  return addField(state, {
    parentId,
    field: {
      ...field,
      id: nanoid(12)
    }
  })
}

export function updateNestFields(
  state: IState,
  { id, nestedFields }: UpdateNestFieldsAction['payload']
): IState {
  const fields = clone(state.fields)
  const index = fields.findIndex(f => f.id === id)

  if (index > -1) {
    fields[index] = {
      ...fields[index],
      properties: {
        ...fields[index].properties,
        fields: nestedFields
      }
    }
  }

  // Reset fields
  const newState = setFields(state, { fields })
  newState.logics = getValidLogics(newState.fields, newState.logics)

  // Select new field
  return selectField(newState, {
    id: state.currentId,
    parentId: id
  })
}

export function updateField(state: IState, { id, updates }: UpdateFieldAction['payload']): IState {
  let fields = clone(state.fields)
  const parentId = state.parentId
  let currentField: FormFieldType | undefined

  if (parentId) {
    const parentField = fields.find(f => f.id === parentId)

    if (parentField) {
      const index = fieldIndex(parentField.properties?.fields, id)

      if (index > -1) {
        currentField = {
          ...parentField.properties!.fields![index],
          ...updates
        }
        parentField.properties!.fields![index] = currentField
      }
    }
  } else {
    const index = fieldIndex(fields, id)

    if (index > -1) {
      currentField = clone({
        ...fields[index],
        ...updates
      })
      fields[index] = currentField
    }
  }

  if (currentField) {
    // Update the field text which belongs to QUESTION_FIELD_KINDS
    if (!helper.isNil(updates.title) && QUESTION_FIELD_KINDS.includes(currentField.kind)) {
      const idx = state.questions.findIndex(q => q.id === id)

      if (idx > -1) {
        let title = htmlUtils.plain(updates.title as string)

        if (helper.isEmpty(title)) {
          title = 'Untitled question'
        }

        state.questions[idx] = {
          ...state.questions[idx],
          title
        }

        const regex = new RegExp(`<span[^>]+data-mention="${id}"([^>]+)?>[^<]+<\\/span>`, 'gi')
        const mention = `<span class="mention" contenteditable="false" data-mention="${id}">@${title}</span>`

        // Update all mention text
        fields = fields.map(f => {
          if (f.title) {
            f.title = (f.title as string).replace(regex, mention)
          }

          if (helper.isValidArray(f.properties?.fields)) {
            f.properties!.fields!.forEach(c => {
              if (c.title) {
                c.title = (c.title as string).replace(regex, mention)
              }
            })
          }

          return f
        })
      }
    }
  }

  // Reset fields
  const newState = setFields(state, { fields })

  // Select new field
  return selectField(newState, {
    id,
    parentId
  })
}

export function deleteField(state: IState, { id, parentId }: DeleteFieldAction['payload']): IState {
  let currentId = state.currentId
  const fields = clone(state.fields)

  if (parentId) {
    const parentField = fields.find(f => f.id === parentId)

    if (parentField) {
      const index = fieldIndex(parentField.properties?.fields, id)

      if (index > -1) {
        currentId = index > 0 ? parentField.properties!.fields![index - 1].id : parentId
        parentId = index > 0 ? parentId : undefined
        parentField.properties!.fields!.splice(index, 1)
      }
    }
  } else {
    const index = fields.findIndex(f => f.id === id)

    if (index > -1) {
      currentId = fields[index > 0 ? index - 1 : index + 1]?.id
      fields.splice(index, 1)
    }
  }

  // Reset fields
  const newState = setFields(state, { fields })

  // Select new field
  return selectField(newState, {
    id: currentId,
    parentId
  })
}

export function setLogics(state: IState, logics: Logic[] = []): IState {
  FormService.updateLogics(state.formId, logics)

  return {
    ...state,
    logics
  }
}

export function setLogic(state: IState, logic: Logic): IState {
  if (!helper.isValidArray(logic.payloads)) {
    return deleteLogic(state, logic)
  }

  const logics = state.logics || []
  const index = logics.findIndex(l => l.fieldId === logic.fieldId)
  let newLogics: Logic[]

  if (index > -1) {
    newLogics = logics.map((l, i) => (i === index ? logic : l))
  } else {
    newLogics = [...logics, logic]
  }

  return setLogics(state, newLogics)
}

export function deleteLogic(state: IState, { fieldId }: DeleteLogicAction['payload']): IState {
  return setLogics(
    state,
    state.logics?.filter(l => l.fieldId !== fieldId)
  )
}

export function cleanLogics(state: IState): IState {
  return setLogics(state, [])
}

export function setVariables(state: IState, variables: Variable[] = []): IState {
  FormService.updateVariables(state.formId, variables)

  return {
    ...state,
    variables
  }
}

export function addVariable(state: IState, variable: Variable): IState {
  return setVariables(state, [...(state.variables || []), variable])
}

export function updateVariable(
  state: IState,
  { id, updates }: UpdateVariableAction['payload']
): IState {
  const variables = state.variables || []
  const index = variables.findIndex(v => v.id === id)

  if (index < 0) {
    return state
  }

  return setVariables(
    state,
    variables.map((v, i) => (i === index ? ({ ...v, ...updates } as Any) : v))
  )
}

export function deleteVariable(state: IState, { id }: DeleteVariableAction['payload']): IState {
  return setVariables(
    state,
    state.variables?.filter(v => v.id !== id)
  )
}

export function selectVariable(
  state: IState,
  { variableId }: SelectVariableAction['payload']
): IState {
  return {
    ...state,
    selectedVariable: state.variables?.find(v => v.id === variableId)
  }
}

export function setActiveTabName(
  state: IState,
  { activeTabName }: SetActiveTabNameAction['payload']
): IState {
  return {
    ...state,
    activeTabName
  }
}

export function setActiveDesignTabName(
  state: IState,
  { activeDesignTabName }: SetActiveDesignTabNameAction['payload']
): IState {
  return {
    ...state,
    activeTabName: 'design',
    activeDesignTabName
  }
}

function setHiddenFields(state: IState, hiddenFields: HiddenField[] = []): IState {
  FormService.updateHiddenFields(state.formId, hiddenFields)

  return {
    ...state,
    hiddenFields
  }
}

export function createHiddenField(state: IState, hiddenField: HiddenField): IState {
  return setHiddenFields(state, [...(state.hiddenFields || []), hiddenField])
}

export function selectHiddenField(
  state: IState,
  { hiddenFieldId }: SelectHiddenFieldAction['payload']
): IState {
  return {
    ...state,
    selectedHiddenField: state.hiddenFields?.find(v => v.id === hiddenFieldId)
  }
}

export function editHiddenField(state: IState, hiddenField: HiddenField): IState {
  const hiddenFields = state.hiddenFields || []
  const index = hiddenFields.findIndex(h => h.id === hiddenField.id)

  if (index < 0) {
    return state
  }

  return setHiddenFields(
    state,
    hiddenFields.map((h, i) => (i === index ? hiddenField : h))
  )
}

export function deleteHiddenField(
  state: IState,
  { id }: DeleteHiddenFieldAction['payload']
): IState {
  return setHiddenFields(
    state,
    (state.hiddenFields || []).filter(h => h.id !== id)
  )
}

export function setSyncing(state: IState, { isSyncing }: SetSyncingAction['payload']): IState {
  return {
    ...state,
    isSyncing
  }
}
