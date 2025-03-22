import type { HiddenField, Logic, Variable } from '@heyform-inc/shared-types-enums'
import { deepEqual } from '@heyform-inc/utils'
import { createContext } from 'react'

import { FormFieldType } from '@/types'

import * as actions from './actions'

export interface IState {
  formId: string
  locale: string
  fields: FormFieldType[]
  // Version to detect changes whether we need to sync with server or not
  version: number
  questions: Partial<FormFieldType>[]
  references: Partial<FormFieldType>[]
  // Selected field id
  currentId?: string
  // Parent field id
  parentId?: string

  // Selected field
  currentField?: FormFieldType
  // Parent field
  parentField?: FormFieldType

  logics?: Logic[]
  variables?: Variable[]
  selectedVariable?: Variable

  hiddenFields: HiddenField[]
  selectedHiddenField?: HiddenField

  activeTabName?: string
  activeDesignTabName?: string

  isSyncing?: boolean
}

export interface SetFieldsAction {
  type: 'setFields'
  payload: {
    fields: FormFieldType[]
  }
}

export interface SelectFieldAction {
  type: 'selectField'
  payload: {
    id?: string
    parentId?: string
  }
}

export interface AddFieldAction {
  type: 'addField'
  payload: {
    field: FormFieldType
    parentId?: string
  }
}

export interface UpdateFieldAction {
  type: 'updateField'
  payload: {
    id: string
    updates: Partial<FormFieldType>
  }
}

export interface UpdateNestFieldsAction {
  type: 'updateNestFields'
  payload: {
    id: string
    nestedFields: FormFieldType[]
  }
}

export interface DuplicateFieldAction {
  type: 'duplicateField'
  payload: {
    id: string
    parentId?: string
  }
}

export interface DeleteFieldAction {
  type: 'deleteField'
  payload: {
    id: string
    parentId?: string
  }
}

interface SetLogicAction {
  type: 'setLogic'
  payload: Logic
}

interface SetLogicsAction {
  type: 'setLogics'
  payload: Logic[]
}

export interface DeleteLogicAction {
  type: 'deleteLogic'
  payload: {
    fieldId: string
  }
}

export interface ClearLogicAction {
  type: 'cleanLogics'
  payload: any
}

interface AddVariableAction {
  type: 'addVariable'
  payload: Variable
}

export interface SelectVariableAction {
  type: 'selectVariable'
  payload: {
    variableId: string
  }
}

export interface UpdateVariableAction {
  type: 'updateVariable'
  payload: {
    id: string
    updates: Partial<Variable>
  }
}

export interface DeleteVariableAction {
  type: 'deleteVariable'
  payload: {
    id: string
  }
}

export interface SetActiveTabNameAction {
  type: 'setActiveTabName'
  payload: {
    activeTabName: string
  }
}

export interface SetActiveDesignTabNameAction {
  type: 'setActiveDesignTabName'
  payload: {
    activeDesignTabName: string
  }
}

export interface CreateHiddenFieldAction {
  type: 'createHiddenField'
  payload: HiddenField
}

export interface SelectHiddenFieldAction {
  type: 'selectHiddenField'
  payload: {
    hiddenFieldId: string
  }
}

export interface EditHiddenFieldAction {
  type: 'editHiddenField'
  payload: HiddenField
}

export interface DeleteHiddenFieldAction {
  type: 'deleteHiddenField'
  payload: Pick<HiddenField, 'id'>
}

export interface SetSyncingAction {
  type: 'setSyncing'
  payload: {
    isSyncing: boolean
  }
}

export interface IContext {
  state: IState
  dispatch: (action: IAction) => void
}

export const StoreContext = createContext<IContext>({
  state: {} as IState,
  dispatch: () => {
    // Do nothing
  }
})

export type IAction =
  | SetFieldsAction
  | SelectFieldAction
  | AddFieldAction
  | UpdateFieldAction
  | UpdateNestFieldsAction
  | DuplicateFieldAction
  | DeleteFieldAction
  | SelectVariableAction
  | AddVariableAction
  | UpdateVariableAction
  | DeleteVariableAction
  | SetLogicAction
  | SetLogicsAction
  | DeleteLogicAction
  | ClearLogicAction
  | SetActiveTabNameAction
  | SetActiveDesignTabNameAction
  | CreateHiddenFieldAction
  | SelectHiddenFieldAction
  | EditHiddenFieldAction
  | DeleteHiddenFieldAction
  | SetSyncingAction

const SYNC_ACTIONS = [
  'setFields',
  'addField',
  'updateField',
  'updateNestFields',
  'duplicateField',
  'deleteField'
]

function handleAction(state: IState, action: IAction): IState {
  const result: IState = (actions as Any)[action.type](state, action.payload as unknown as Any)

  if (deepEqual(result, state)) {
    return state
  }

  if (SYNC_ACTIONS.includes(action.type)) {
    result.version += 1
  }

  return result
}

export const storeReducer = (state: IState, action: IAction) => {
  switch (action.type) {
    case 'setFields':
    case 'selectField':
    case 'addField':
    case 'updateField':
    case 'updateNestFields':
    case 'duplicateField':
    case 'deleteField':
    case 'setLogic':
    case 'setLogics':
    case 'deleteLogic':
    case 'cleanLogics':
    case 'selectVariable':
    case 'addVariable':
    case 'updateVariable':
    case 'deleteVariable':
    case 'setActiveTabName':
    case 'setActiveDesignTabName':
    case 'createHiddenField':
    case 'selectHiddenField':
    case 'editHiddenField':
    case 'deleteHiddenField':
    case 'setSyncing':
      return handleAction(state, action)

    default:
      console.warn(`Unknown action type: ${(action as unknown as Any).type}`)
      return state
  }
}
