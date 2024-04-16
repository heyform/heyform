import type { HiddenField, Logic, Variable } from '@heyform-inc/shared-types-enums'
import { deepEqual } from 'fast-equals'
import { createContext } from 'react'

import type { FormField } from '@/models'

import * as actions from './actions'

export interface IState {
  formId: string
  locale: string
  fields: FormField[]
  hiddenFields: HiddenField[]
  // Version to detect changes whether we need to sync with server or not
  version: number
  questions: Partial<FormField>[]
  references: Partial<FormField>[]
  // Selected field id
  selectedId?: string
  // Parent field id
  parentId?: string

  // Selected field
  selectedField?: FormField
  // Parent field
  parentField?: FormField

  logics?: Logic[]
  variables?: Variable[]
  selectedVariable?: Variable

  isLogicPanelOpen?: boolean
  isVariablePanelOpen?: boolean
  isBulkEditPanelOpen?: boolean
  activeTabName?: string
}

export interface SetFieldsAction {
  type: 'setFields'
  payload: {
    fields: FormField[]
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
    field: FormField
    parentId?: string
  }
}

export interface UpdateFieldAction {
  type: 'updateField'
  payload: {
    id: string
    updates: Partial<FormField>
  }
}

export interface UpdateNestFieldsAction {
  type: 'updateNestFields'
  payload: {
    id: string
    nestedFields: FormField[]
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

export interface TogglePanelAction {
  type: 'togglePanel'
  payload: {
    isLogicPanelOpen?: boolean
    isVariablePanelOpen?: boolean
    isBulkEditPanelOpen?: boolean
  }
}

export interface SetActiveTabNameAction {
  type: 'setActiveTabName'
  payload: {
    activeTabName: string
  }
}

export interface CreateHiddenFieldAction {
  type: 'createHiddenField'
  payload: HiddenField
}

export interface EditHiddenFieldAction {
  type: 'editHiddenField'
  payload: HiddenField
}

export interface DeleteHiddenFieldAction {
  type: 'deleteHiddenField'
  payload: Pick<HiddenField, 'id'>
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
  | TogglePanelAction
  | SetActiveTabNameAction
  | CreateHiddenFieldAction
  | EditHiddenFieldAction
  | DeleteHiddenFieldAction

const SYNC_ACTIONS = [
  'setFields',
  'addField',
  'updateField',
  'updateNestFields',
  'duplicateField',
  'deleteField'
]

function handleAction(state: IState, action: IAction): IState {
  const result: IState = (actions as any)[action.type](state, action.payload as unknown as any)

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
    case 'togglePanel':
    case 'setActiveTabName':
    case 'createHiddenField':
    case 'editHiddenField':
    case 'deleteHiddenField':
      return handleAction(state, action)

    default:
      console.warn(`Unknown action type: ${(action as unknown as any).type}`)
      return state
  }
}
