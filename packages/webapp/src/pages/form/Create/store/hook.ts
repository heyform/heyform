import { useContext } from 'react'

import type { IContext } from './context'
import { StoreContext } from './context'

export function useStoreContext(): IContext {
  return useContext(StoreContext)
}
