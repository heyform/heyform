import { useCallback, useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface AppStoreType {
  modals: Map<string, Any>

  openModal: (name: string, payload?: AnyMap) => void
  closeModal: (name: string) => void
  updateModal: (name: string, updates: AnyMap) => void
}

export function useModal<T = Any>(name: string) {
  const { modals, openModal, closeModal, updateModal } = useAppStore()

  const isOpen = useMemo(() => modals.has(name), [name, modals])
  const payload = useMemo(() => modals.get(name) as T, [name, modals])

  const open = useCallback(() => {
    openModal(name)
  }, [name, openModal])

  const close = useCallback(() => {
    closeModal(name)
  }, [name, closeModal])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [close, isOpen, open])

  const update = useCallback(
    (updates: AnyMap) => {
      updateModal(name, updates)
    },
    [name, updateModal]
  )

  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        open()
      } else {
        close()
      }
    },
    [open, close]
  )

  return {
    isOpen,
    payload,
    open,
    close,
    toggle,
    update,
    onOpenChange
  }
}

export const useAppStore = create<AppStoreType>()(
  immer(set => ({
    modals: new Map(),

    openModal: (name, payload) => {
      set(state => {
        state.modals.set(name, payload)
      })
    },

    closeModal: name => {
      set(state => {
        state.modals.delete(name)
      })
    },

    updateModal: (name, updates) => {
      set(state => {
        const modal = state.modals.get(name)

        if (modal) {
          state.modals.set(name, {
            ...modal,
            ...updates
          })
        }
      })
    }
  }))
)
