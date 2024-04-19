import type { Choice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import type { WheelEvent } from 'react'
import { useCallback, useMemo, useState } from 'react'

import { KeyCode } from '@/components/ui'

import { GlobalTimeout } from '../utils'

interface SelectionRange {
  allowMultiple: boolean
  min: number
  max: number
}

function resetNumber(num?: number, defaultValue?: number): number {
  if (helper.isValid(num) && helper.isNumber(num) && num! > 0) {
    return num!
  }
  return defaultValue!
}

export function useChoicesOption(choices?: Choice[], randomize = false): any[] {
  return useMemo(() => {
    if (!helper.isValidArray(choices)) {
      return []
    }

    let list = choices!

    if (randomize) {
      list = list.sort(() => Math.random() - 0.5)
    }

    return list.map((choice, index) => ({
      keyName: String.fromCharCode(KeyCode.A + index),
      label: choice.label,
      value: choice.id,
      image: choice.image
    }))
  }, [choices])
}

export function useSelectionRange(
  allowMultiple?: boolean,
  min?: number,
  max?: number
): SelectionRange {
  return useMemo(() => {
    const range: SelectionRange = {
      allowMultiple: allowMultiple ?? false,
      min: 1,
      max: 1
    }

    if (allowMultiple) {
      range.min = resetNumber(min, 0)
      range.max = resetNumber(max, 0)

      if (range.min > range.max) {
        range.min = 0
      }
    }

    range.allowMultiple = range.max !== 1
    return range
  }, [allowMultiple, min, max])
}

// Global variable to prevent multiple scroll events
let isWheelScrollDisabled = false

export function useWheelScroll(
  isScrollable?: boolean,
  isScrolledToTop?: boolean,
  isScrolledToBottom?: boolean,
  onScroll?: (type: 'scrollNext' | 'scrollPrevious') => void
) {
  const [accumulated, setAccumulated] = useState(0)

  function disableWheelScroll() {
    setAccumulated(0)
    isWheelScrollDisabled = true

    GlobalTimeout.add({
      name: 'disableWheelScroll',
      duration: 500,
      callback: () => {
        isWheelScrollDisabled = false
      }
    })
  }

  function handleNext() {
    disableWheelScroll()
    isScrolledToBottom && onScroll?.('scrollNext')
  }

  function handlePrevious() {
    disableWheelScroll()
    isScrolledToTop && onScroll?.('scrollPrevious')
  }

  function handleWheelScroll(event: WheelEvent) {
    if (!isScrollable || isWheelScrollDisabled) {
      return
    }

    GlobalTimeout.add({
      name: 'setAccumulated',
      duration: 500,
      callback: () => setAccumulated(0)
    })

    const value = accumulated + event.deltaY
    setAccumulated(value)

    if (value < -300) {
      handlePrevious()
    } else if (value > 300) {
      handleNext()
    }
  }

  return useCallback(handleWheelScroll, [
    isScrollable,
    isScrolledToTop,
    isScrolledToBottom,
    accumulated
  ])
}
