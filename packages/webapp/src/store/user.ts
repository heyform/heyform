import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { USER_STORAGE_KEY } from '@/consts'
import { UserType } from '@/types'

interface UserStoreType {
  user: UserType
  temporaryEmail?: string

  setUser: (user: UserType) => void
  updateUser: (user: Partial<UserType>) => void
  setTemporaryEmail: (email?: string) => void
}

export const useUserStore = create<UserStoreType>()(
  persist(
    immer(set => ({
      user: {} as UserType,

      setUser: user => {
        set(state => {
          state.user = user
        })
      },

      updateUser: user => {
        set(state => {
          state.user = { ...state.user, ...user }
        })
      },

      setTemporaryEmail: email => {
        set(state => {
          state.temporaryEmail = email
        })
      }
    })),
    {
      name: USER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: state =>
        Object.fromEntries(Object.entries(state).filter(([key]) => ['user'].includes(key)))
    }
  )
)
