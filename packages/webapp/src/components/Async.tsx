import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'

interface AsyncProps extends IComponentProps {
  request: () => Promise<any>
  immediate?: boolean
  deps?: any[]
  cacheFirst?: boolean
  skeleton?: ReactNode
  emptyState?: ReactNode
  errorRender?: (err: Error) => ReactNode
}

export const Async: FC<AsyncProps> = ({
  className,
  style,
  request,
  immediate = true,
  deps = [],
  cacheFirst = false,
  skeleton,
  emptyState,
  errorRender,
  children
}) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(() => {
    setStatus('pending')
    setError(null)

    return request()
      .then(data => {
        setResult(data)
        setStatus('success')
      })
      .catch((err: any) => {
        setError(err)
        setStatus('error')
      })
  }, [request])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, deps.concat(immediate))

  return (
    <div className={className} style={style}>
      {status === 'idle' && cacheFirst && children}
      {status === 'pending' && (!cacheFirst ? skeleton : children)}
      {status === 'error' && (errorRender ? errorRender(error!) : children)}
      {status === 'success' && (!result && emptyState ? emptyState : children)}
    </div>
  )
}
