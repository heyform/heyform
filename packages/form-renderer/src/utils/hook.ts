import { useCallback, useEffect } from 'react'
import { useTranslation as useReactTranslation } from 'react-i18next'

import { useStore } from '../store'
import { AnyMap } from '../typings'

export function useTranslation(overrideLng?: string) {
  const { t: _t, i18n } = useReactTranslation()
  const { state } = useStore()

  const t = useCallback((key: string, options?: AnyMap) => {
    return _t(key, {
      ...options,
      lng: overrideLng || state.locale
    })
  }, [])

  return { t, i18n }
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
  }, [handleKeyDown])
}

export function useEnterKey(id: string, callback: (event: KeyboardEvent) => void) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const elem = document.getElementById(id)

      if (elem?.classList.contains('heyform-body-active') && event.key === 'Enter') {
        const isIgnoredElement = (event.target as any)?.matches(
          'input, [contenteditable="true"], [contenteditable="true"] *'
        )
        const isDropdownOpen = document.body.classList.contains('heyform-dropdown-open')

        if (!isIgnoredElement && !isDropdownOpen) {
          callback(event)
        }
      }
    },
    [callback, id]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}
