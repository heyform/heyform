import type { FC, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PortalProps {
  visible?: boolean
  container?: HTMLElement
  children: ReactNode
}

export const Portal: FC<PortalProps> = ({ visible, container, children }) => {
  if (!visible || !children) {
    return null
  }

  return createPortal(children, container || document.body)
}
