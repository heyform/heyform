import { useRequest } from 'ahooks'
import { FC, ReactNode, useEffect, useState } from 'react'

export interface EmptyRenderProps {
  refresh: () => Promise<Any>
}

export interface AsyncProps {
  loader?: ReactNode
  cacheFirst?: boolean
  fetch: () => Promise<boolean>
  refreshDeps?: any[]
  emptyRender?: (props: EmptyRenderProps) => ReactNode
  errorRender?: (err: Error) => ReactNode
  children: ReactNode
  className?: string
}

export const Async: FC<AsyncProps> = ({
  loader,
  cacheFirst = false,
  fetch,
  refreshDeps,
  emptyRender,
  errorRender,
  children
}) => {
  const [state, setState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  const {
    data,
    error,
    runAsync: refresh,
    cancel
  } = useRequest(
    async () => {
      return await fetch()
    },
    {
      refreshDeps,
      onBefore() {
        setState('pending')
      },
      onSuccess() {
        setState('success')
      },
      onError() {
        setState('error')
      }
    }
  )

  useEffect(() => {
    return () => {
      cancel()
    }
  }, [])

  switch (state) {
    case 'idle':
      return cacheFirst ? children : null

    case 'pending':
      return cacheFirst ? children : loader

    case 'success':
      return !data && emptyRender ? emptyRender({ refresh }) : children

    case 'error':
      return errorRender ? errorRender(error as Error) : children

    default:
      return null
  }
}
