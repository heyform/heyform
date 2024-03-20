import { useCallback, useEffect, useRef } from 'react'

// https://reactjs.org/docs/hooks-faq.html#what-can-i-do-if-my-effect-dependencies-change-too-often
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLatestFunc<T extends (...args: any[]) => any>(fn: T) {
  const ref = useRef(fn)

  useEffect(() => {
    ref.current = fn
  })

  return useCallback((...args: Parameters<T>) => {
    ref.current(...args)
  }, [])
}
