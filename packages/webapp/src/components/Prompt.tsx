import { useCallback } from 'react'
import { createRoot } from 'react-dom/client'

import { Modal, PromptModalProps } from './Modal'

function createContainer() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

export function usePrompt() {
  return useCallback((props: Omit<PromptModalProps, 'open' | 'onOpenChange'>) => {
    const dialogContainer = createContainer()
    const root = createRoot(dialogContainer)

    function handleOpenChange(open: boolean) {
      if (!open) {
        root.unmount()
        document.body.removeChild(dialogContainer)
      }
    }

    function onChange(values: any) {
      props.onChange?.(values)
      handleOpenChange(false)
    }

    root.render(
      <Modal.Prompt open={true} {...props} onChange={onChange} onOpenChange={handleOpenChange} />
    )
  }, [])
}
