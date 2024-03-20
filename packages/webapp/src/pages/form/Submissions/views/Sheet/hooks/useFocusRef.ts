import { useLayoutEffect, useRef } from 'react'

export function useFocusRef<T extends HTMLOrSVGElement>(isCellSelected: boolean | undefined) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    if (!isCellSelected) return
    ref.current?.focus({ preventScroll: true })
  }, [isCellSelected])

  return ref
}
