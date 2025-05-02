import { useCallback, useEffect, useRef } from 'react'

import { mousedownEvent } from './utils'

export default function useIsMounted(deps: unknown[]): () => boolean {
  const ref = useRef(false)

  useEffect(() => {
    ref.current = true
    return () => {
      ref.current = false
    }
  }, [deps])

  return useCallback(() => ref.current, [ref])
}

export function useOnClickOutside(
  element: HTMLElement,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!element || element.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener(mousedownEvent, listener)

    return () => {
      document.removeEventListener(mousedownEvent, listener)
    }
  }, [element, handler])
}

export function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isLocked])
}
