import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { ChatMessageType } from '@/types'

interface ChatStoreType {
  status: 'loading' | 'pending' | 'idle'
  messages: ChatMessageType[]

  setStatus: (status: 'loading' | 'pending' | 'idle') => void
  addMessage: (message: ChatMessageType) => void
  updateMessage: (messageId: string, updates: Partial<ChatMessageType>) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStoreType>()(
  immer(set => ({
    status: 'idle',
    messages: [],

    setStatus(status) {
      set(state => {
        state.status = status
      })
    },

    addMessage(message) {
      set(state => {
        state.messages.push(message)
      })
    },

    updateMessage(messageId, updates) {
      set(state => {
        const index = state.messages.findIndex(m => m.id === messageId)

        if (index > -1) {
          state.messages[index] = {
            ...state.messages[index],
            ...updates
          }
        }
      })
    },

    clearMessages() {
      set(state => {
        state.messages = []
      })
    }
  }))
)
