import { Context, createContext, LegacyRef, MutableRefObject, RefCallback } from 'react'

import { AnyMap } from '../typings'

export const isTouchDevice =
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
export const mousedownEvent = isTouchDevice ? 'touchstart' : 'mousedown'

export function preventDefault(event: any) {
  event.preventDefault()
}

export function stopPropagation(event: any) {
  event.stopPropagation()
}

export function stopEvent(event: any) {
  preventDefault(event)
  stopPropagation(event)
}

export function mergeRefs<T = any>(
  refs: Array<MutableRefObject<T> | LegacyRef<T>>
): RefCallback<T> {
  return value => {
    refs.forEach((ref: any) => {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        ref.current = value
      }
    })
  }
}

export interface StoreAction<T = string, P = any> {
  type: T
  payload?: P
}

export interface StoreContext<S = AnyMap, A = StoreAction> {
  state: S
  dispatch: (action: A) => void
}

export function createStoreContext<S = AnyMap, A = StoreAction>(
  initialState: S
): Context<StoreContext<S, A>> {
  return createContext<StoreContext<S, A>>({
    state: initialState,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    dispatch: (() => {}) as (action: A) => void
  })
}

export function createStoreReducer<S = AnyMap, P = any>(
  actions: Record<string, (state: S, payload?: P) => S>,
  callback: (state: S, newState: S) => S
) {
  return (state: S, action: StoreAction<string, P>) => {
    return callback(state, actions[action.type](state, action.payload))
  }
}

export const isURL = (arg: any) => /^https?:\/\//i.test(arg)
