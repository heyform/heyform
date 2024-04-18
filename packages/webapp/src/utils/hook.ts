import { helper, parseNumber, pickObject, qs, removeObjectNil } from '@heyform-inc/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { GEETEST_CAPTCHA_ID } from '@/consts'
import { loadScript } from '@/utils/helper'

export interface ParamsType {
  workspaceId: string
  projectId: string
  formId: string
  templateId: string
  category: string
  inviteCode: string
}

export function useParam(): ParamsType {
  const { workspaceId, projectId, formId, templateId, inviteCode, category } =
    useParams<IMapType<string>>()

  return {
    workspaceId,
    projectId,
    formId,
    templateId,
    category,
    inviteCode
  } as ParamsType
}

export function useQuery(options?: IMapType): IMapType {
  const location = useLocation()

  return useMemo(() => {
    const value = qs.parse(location.search, {
      decode: true,
      separator: ','
    })

    if (options) {
      Object.keys(options).forEach(key => {
        let type: any
        let defaultValue: any

        if (helper.isObject(options[key])) {
          type = options[key].type
          defaultValue = options[key].defaultValue
        } else {
          type = options[key]
        }

        if (!helper.isNil(value[key])) {
          switch (type.name) {
            case 'String':
              value[key] = value[key]
              break

            case 'Number':
              value[key] = parseNumber(value[key], defaultValue)
              break

            case 'Boolean':
              value[key] = Boolean(value[key])
              break

            case 'Array':
              value[key] = (helper.isArray(value[key]) ? value[key] : [value[key]]).filter(
                helper.isValid
              )
              break
          }
        }

        if (helper.isEmpty(value[key]) && defaultValue) {
          value[key] = defaultValue
        }
      })
    }

    return value
  }, [location])
}

export function useAsyncEffect<T>(asyncFunction: () => Promise<T>, deps: any[] = []) {
  const execute = useCallback(() => {
    return asyncFunction()
  }, [asyncFunction])

  useEffect(() => {
    execute()
  }, deps)
}

// Fork from https://usehooks.com/useAsync/
export function useAsync<T = any>(
  asyncFunction: () => Promise<T>,
  initialResult: T,
  deps: any[] = []
) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<T | null>(initialResult)
  const [error, setError] = useState<Error | null>(null)

  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the below useEffect is not called
  // on every render, but only if asyncFunction changes.
  const execute = useCallback(() => {
    setLoading(true)
    setError(null)

    return asyncFunction()
      .then(setResult)
      .catch(setError)
      .finally(() => {
        setLoading(false)
      })
  }, [asyncFunction])

  useEffect(() => {
    execute()
  }, deps)

  return { result, loading, error }
}

export function useVisible(visible = false): [boolean, () => void, () => void] {
  const [isOpen, setIsOpen] = useState(visible)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return [isOpen, open, close]
}

export function useRouter() {
  const navigate = useNavigate()

  const push = useCallback((url: string) => {
    navigate(url)
  }, [])

  const replace = useCallback((url: string) => {
    navigate(url, {
      replace: true
    })
  }, [])

  const redirect = useCallback((url?: string) => {
    window.location.href = url || '/'
  }, [])

  return { push, replace, redirect }
}

export function useCountDown(max = 60) {
  const [count, setCount] = useState(0)
  const timerRef = useRef<any>(null)

  function stop() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
    setCount(0)
  }

  function start() {
    setCount(max)
    timerRef.current = window.setInterval(() => {
      setCount(c => c - 1)
    }, 1000)
  }

  const startCallback = useCallback(start, [count, max])
  const stopCallback = useCallback(stop, [])

  useEffect(() => {
    if (count < 1) {
      stopCallback()
    }
  }, [count])

  useEffect(() => {
    return stopCallback
  }, [])

  return {
    count,
    startCountDown: startCallback,
    stopCountDown: stopCallback
  }
}

export function useCaptcha(onSuccess: (data: any) => void, onError?: (err: any) => void) {
  const captchaRef = useRef<any>(null)

  function showCaptcha() {
    captchaRef.current?.showCaptcha()
  }

  function initGeetest() {
    window.initGeetest(
      {
        captchaId: GEETEST_CAPTCHA_ID,
        product: 'bind'
      },
      (c: any) => {
        c.onReady(() => {
          captchaRef.current = c
        })
          .onSuccess(() => {
            const values = captchaRef.current?.getValidate()
            const data = pickObject(values, [
              ['lot_number', 'lotNumber'],
              ['captcha_output', 'captchaOutput'],
              ['pass_token', 'passToken'],
              ['gen_time', 'genTime']
            ])

            onSuccess(data)
            c.reset()
          })
          .onError(onError)
      }
    )
  }

  useEffect(() => {
    loadScript('geetest-v4', 'https://static.geetest.com/v4/gt4.js', initGeetest)
  }, [onSuccess])

  return {
    showCaptcha
  }
}

export function useQueryURL(to: string) {
  const query = useQuery()
  const q = removeObjectNil(query)

  if (helper.isEmpty(q)) {
    return to
  }

  const separator = !to.includes('?') ? '?' : '&'
  return to + separator + qs.stringify(q, { encode: true })
}

interface UswWindowOptions {
  source: string
  features?: string
}

export function useWindow(
  url?: string | null,
  options?: UswWindowOptions,
  listener?: (window: Window, payload: any) => void
) {
  const windowRef = useRef<Window | null>()

  function messageListener(event: MessageEvent) {
    if (event.origin === window.location.origin && event.data.source === options?.source) {
      listener?.(windowRef.current!, event.data.payload)
    }
  }

  useEffect(() => {
    if (url) {
      windowRef.current = window.open(url, '_blank', options?.features)
    }
  }, [url])

  useEffect(() => {
    window.addEventListener('message', messageListener)

    return () => {
      window.removeEventListener('message', messageListener)
    }
  }, [])
}

export function useKey(key: string, callback: (event: KeyboardEvent) => void) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === key) {
        const isIgnoredElement = (event.target as any)?.matches(
          'input, [contenteditable="true"], [contenteditable="true"] *'
        )

        if (!isIgnoredElement) {
          callback(event)
        }
      }
    },
    [key, callback]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}
