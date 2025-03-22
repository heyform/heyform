import { nanoid } from '@heyform-inc/utils'
import { Action, Close, Description, Provider, Root, Title, Viewport } from '@radix-ui/react-toast'
import { IconX } from '@tabler/icons-react'
import { ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { Button } from './Button'

interface Toast {
  id: string
  title?: ReactNode
  message?: ReactNode
  action?: typeof Action
  duration?: number
}

interface ToastStoreType {
  timeouts: Map<string, Timeout>
  toasts: Toast[]
  add: (toast: Toast, timeout: Timeout) => void
  remove: (toastId: string) => void
}

const useToastStore = create<ToastStoreType>()(
  immer(set => ({
    timeouts: new Map<string, Timeout>(),
    toasts: [],

    add: (toast: Toast, timeout: Timeout) => {
      set(state => {
        state.toasts.push(toast)
        state.timeouts.set(toast.id, timeout)
      })
    },

    remove: (toastId: string) => {
      set(state => {
        if (state.timeouts.has(toastId)) {
          clearTimeout(state.timeouts.get(toastId)!)
        }

        state.timeouts.delete(toastId)
        state.toasts = state.toasts.filter(t => t.id !== toastId)
      })
    }
  }))
)

export function useToast() {
  const { timeouts, add, remove } = useToastStore()

  return useCallback(
    (props: Omit<Toast, 'id'>) => {
      const toastId = nanoid(4)

      if (timeouts.has(toastId)) {
        return
      }

      const duration = props.duration || 5_000
      const timeout = setTimeout(() => remove(toastId), duration)

      add({ ...props, id: toastId, duration }, timeout)

      return {
        id: toastId,
        dismiss: () => remove(toastId)
      }
    },
    [add, remove, timeouts]
  )
}

export const Toaster = () => {
  const { t } = useTranslation()
  const { toasts, remove } = useToastStore()

  return (
    <Provider>
      {toasts.map(row => (
        <Root
          key={row.id}
          className="relative w-full rounded-lg bg-foreground px-3 py-2 opacity-100 shadow-lg ring-1 ring-accent data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full"
          duration={row.duration}
          onOpenChange={open => !open && remove(row.id)}
        >
          <Title className="text-sm/6 font-semibold">{row.title}</Title>
          <Description className="text-sm text-secondary">{row.message}</Description>
          <Close asChild>
            <Button.Link
              className="absolute right-1 top-1.5 text-secondary hover:text-primary"
              size="sm"
              iconOnly
              onClick={() => remove(row.id)}
            >
              <span className="sr-only">{t('components.close')}</span>
              <IconX className="h-5 w-5" />
            </Button.Link>
          </Close>
        </Root>
      ))}
      <Viewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-y-1.5 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[26.25rem]" />
    </Provider>
  )
}
