import clsx from 'clsx'
import type { FC, WheelEvent } from 'react'
import { useEffect, useState } from 'react'

import type { IComponentProps } from '@/components'

import { Timeout } from '../utils'

interface SlideProps extends Omit<IComponentProps, 'onChange'> {
  index: number
  count: number
  onChange: (scrollIndex: number, scrollTo: 'next' | 'previous') => void
}

// Global Timeout
const timeout = new Timeout()

export const Slide: FC<SlideProps> = ({
  className,
  index,
  count,
  children,
  onChange,
  ...restProps
}) => {
  const [isSwipeDisabled, setIsSwipeDisabled] = useState(false)
  const [accumulated, setAccumulated] = useState(0)

  function disableSwipe() {
    setAccumulated(0)
    setIsSwipeDisabled(true)

    timeout.add({
      name: 'disableSwipe',
      duration: 800,
      callback() {
        setIsSwipeDisabled(false)
      }
    })
  }

  function next() {
    disableSwipe()

    if (index >= count - 1) {
      return
    }

    onChange(index + 1, 'next')
  }

  function previous() {
    disableSwipe()

    if (index < 1) {
      return
    }

    onChange(index - 1, 'previous')
  }

  function handleWheelScroll(event: WheelEvent) {
    if (isSwipeDisabled) {
      return
    }

    timeout.add({
      name: 'setAccumulated',
      duration: 800,
      callback() {
        setAccumulated(0)
      }
    })

    const value = accumulated + event.deltaY
    setAccumulated(value)

    if (value < -300) {
      previous()
    } else if (value > 300) {
      next()
    }
  }

  useEffect(() => {
    return () => {
      timeout.clear()
    }
  }, [])

  return (
    <div className={clsx('heyform-slide', className)} onWheel={handleWheelScroll} {...restProps}>
      {children}
    </div>
  )
}
