import { useCallback } from 'react'
import { createRoot } from 'react-dom/client'

import { AlertModalProps, Modal } from './Modal'

function createContainer() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

export function useAlert() {
  return useCallback((props: Omit<AlertModalProps, 'open' | 'onOpenChange'>) => {
    const dialogContainer = createContainer()
    const root = createRoot(dialogContainer)

    function handleOpenChange(open: boolean) {
      if (!open) {
        root.unmount()
        document.body.removeChild(dialogContainer)
      }
    }

    function onFinish() {
      props.onFinish?.()
      handleOpenChange(false)
    }

    root.render(
      <Modal.Alert open={true} {...props} onFinish={onFinish} onOpenChange={handleOpenChange} />
    )
  }, [])
}
