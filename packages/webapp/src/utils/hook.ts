import { excludeObject, qs, toURLQuery } from '@heyform-inc/utils'
import { useBoolean } from 'ahooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

export function useQuery(): AnyMap {
  const location = useLocation()

  return useMemo(() => qs.parse(location.search.replace(/^\?/, '')), [location])
}

export function useParam() {
  const { workspaceId, projectId, formId, templateId, code, categoryId } = useParams() as AnyMap<
    string,
    string
  >

  return {
    workspaceId,
    projectId,
    formId,
    templateId,
    categoryId,
    code
  }
}

interface UseRouterOptions {
  query?: AnyMap
  state?: any
  exclude?: string[]
  extend?: boolean
}

function getRouterURL(url: string, query: AnyMap, excludes?: string[]) {
  return toURLQuery(excludeObject(query, excludes), url)
}

export function useRouter() {
  const navigate = useNavigate()
  const rawQuery = useQuery()

  const push = useCallback(
    (url: string, options?: UseRouterOptions) => {
      const query = { ...(options?.extend === false ? {} : rawQuery), ...options?.query }

      navigate(getRouterURL(url, query, options?.exclude), {
        state: options?.state
      })
    },
    [navigate, rawQuery]
  )

  const replace = useCallback(
    (url: string, options?: UseRouterOptions) => {
      const query = { ...(options?.extend === false ? {} : rawQuery), ...options?.query }

      navigate(getRouterURL(url, query, options?.exclude), {
        replace: true,
        state: options?.state
      })
    },
    [navigate, rawQuery]
  )

  const redirect = useCallback(
    (url?: string, options?: UseRouterOptions) => {
      const query = { ...(options?.extend === false ? {} : rawQuery), ...options?.query }

      window.location.href = getRouterURL(url || '/', query, options?.exclude)
    },
    [rawQuery]
  )

  return {
    push,
    replace,
    redirect
  }
}

export function useFormState(): [
  boolean,
  Error | undefined,
  {
    setTrue: () => void
    setFalse: () => void
    setError: (error?: Error) => void
  }
] {
  const [loading, { setTrue, setFalse }] = useBoolean(false)
  const [error, setError] = useState<Error>()

  return [
    loading,
    error,
    {
      setTrue,
      setFalse,
      setError
    }
  ]
}

export function useWindow(
  source: string,
  onMessage: (win: Window, payload: any) => void,
  onClose?: () => void
) {
  const winRef = useRef<Window | null>(null)

  const messageListener = useCallback(
    (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data.source === source) {
        onMessage(winRef.current!, event.data.payload)
      }
    },
    [source, onMessage]
  )

  function openWindow(url: string, features = 'scrollbars=yes,resizable=yes,width=600,height=800') {
    const win = window.open(url, '', features)!
    const timer = setInterval(() => {
      if (!win) {
        clearInterval(timer)
      }

      // Check if the window is closed every second
      else if (win.closed) {
        clearInterval(timer)
        onClose?.()
      }
    }, 1_000)

    winRef.current = win
  }

  useEffect(() => {
    window.addEventListener('message', messageListener)

    return () => {
      window.removeEventListener('message', messageListener)
    }
  }, [])

  return openWindow
}
