import { Context, createContext } from 'react'

import { IMapType } from './ui/typing'

export interface StoreAction<T = string, P = any> {
  type: T
  payload?: P
}

export interface StoreContext<S = IMapType, A = StoreAction> {
  state: S
  dispatch: (action: A) => void
}

export function createStoreContext<S = IMapType, A = StoreAction>(
  initialState: S
): Context<StoreContext<S, A>> {
  return createContext<StoreContext<S, A>>({
    state: initialState,
    dispatch: (() => {}) as (action: A) => void
  })
}

export function createStoreReducer<S = IMapType, P = any>(
  actions: Record<string, (state: S, payload?: P) => S>,
  callback: (state: S, newState: S) => S
) {
  return (state: S, action: StoreAction<string, P>) => {
    return callback(state, actions[action.type](state, action.payload))
  }
}
