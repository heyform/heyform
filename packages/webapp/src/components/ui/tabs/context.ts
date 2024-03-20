import { helper } from '@heyform-inc/utils'
import { deepEqual } from 'fast-equals'

import { createStoreContext, createStoreReducer } from '@/components/store'

import type { TabsPaneProps } from './Pane'

export type ITab = Pick<TabsPaneProps, 'name' | 'title' | 'disabled'>

interface IState {
  type: 'navbar' | 'segment' | 'select'
  tabs: ITab[]
  activeName?: any
  onChange?: (name: any) => void
}

const actions: any = {
  register(state: IState, tab: ITab): IState {
    if (state.tabs.findIndex(t => t.name === tab.name) > -1) {
      console.warn(`Tabs.Pane "${tab.name}" already registered`)
      return state
    }

    let { activeName } = state

    if (helper.isEmpty(activeName)) {
      activeName = tab.name
    }

    return {
      ...state,
      activeName,
      tabs: [...state.tabs, tab]
    }
  },

  unregister(state: IState, name: any): IState {
    return {
      ...state,
      activeName: state.activeName === name ? undefined : state.activeName,
      tabs: state.tabs.filter(t => t.name !== name)
    }
  },

  setActive(state: IState, activeName: string) {
    return {
      ...state,
      activeName
    }
  }
}

export const TabsStoreContext = createStoreContext<IState>({
  tabs: [],
  type: 'navbar'
})

export const TabsStoreReducer = createStoreReducer<IState>(actions, (state, newState) => {
  return deepEqual(state, newState) ? state : newState
})
