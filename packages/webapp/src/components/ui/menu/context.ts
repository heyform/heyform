import { deepEqual } from 'fast-equals'

import { createStoreContext, createStoreReducer } from '@/components/store'

interface IState {
  values: any[]
  highlighted?: any
  onClick?: (value?: any) => void
}

const actions: any = {
  register(state: IState, { value }: any): IState {
    if (state.values.includes(value)) {
      console.warn(`Menu.Item "${value}" already registered`)
      return state
    }

    return {
      ...state,
      values: [...state.values, value]
    }
  },

  unregister(state: IState, { value }: any): IState {
    return {
      ...state,
      highlighted: state.highlighted === value ? undefined : state.highlighted,
      values: state.values.filter(k => k !== value)
    }
  },

  highlight(state: IState, { index }: any) {
    return {
      ...state,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      highlighted: state.values.at(index)
    }
  }
}

export const MenusStoreContext = createStoreContext<IState>({
  values: []
})

export const MenusStoreReducer = createStoreReducer<IState>(actions, (state, newState) => {
  return deepEqual(state, newState) ? state : newState
})
