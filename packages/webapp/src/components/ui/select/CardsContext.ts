import { deepEqual } from 'fast-equals'

import { createStoreContext, createStoreReducer } from '@/components/store'

interface IState {
  names: string[]
  activeName?: string
  onChange?: (value: string) => void
}

const actions: any = {
  register(state: IState, name: string): IState {
    if (state.names.findIndex(n => n === name) > -1) {
      console.warn(`Select.Card "${name}" already registered`)
      return state
    }

    return {
      ...state,
      names: [...state.names, name]
    }
  },

  unregister(state: IState, name: string): IState {
    return {
      ...state,
      activeName: state.activeName === name ? undefined : state.activeName,
      names: state.names.filter(n => n === name)
    }
  },

  setActive(state: IState, activeName: string) {
    return {
      ...state,
      activeName
    }
  }
}

export const SelectCardsContext = createStoreContext<IState>({
  names: []
})

export const SelectCardsReducer = createStoreReducer<IState>(actions, (state, newState) => {
  return deepEqual(state, newState) ? state : newState
})
