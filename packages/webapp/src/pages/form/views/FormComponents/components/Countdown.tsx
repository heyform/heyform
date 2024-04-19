import type { FormSettings } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'

interface CountdownProps {
  settings: FormSettings
  onEnd?: () => void
}

function parseTime(t: number) {
  const hours = Math.floor(t / 3600)
  const minutes = Math.floor((t - hours * 3600) / 60)
  const seconds = t - hours * 3600 - minutes * 60

  return [hours > 0 ? hours : null, minutes, seconds]
    .filter(row => row !== null)
    .map(row => String(row).padStart(2, '0'))
    .join(':')
}

export const Countdown: FC<CountdownProps> = ({ settings, onEnd }) => {
  const [timeLimit, setTimeLimit] = useState(settings.timeLimit!)
  const timer = useRef<any>()

  function stopTimer() {
    if (timer.current) {
      clearInterval(timer.current)
    }
  }

  useEffect(() => {
    if (timeLimit < 1) {
      stopTimer()
      onEnd?.()
    }
  }, [timeLimit])

  useEffect(() => {
    timer.current = setInterval(() => {
      setTimeLimit(t => t - 1)
    }, 1000)

    return stopTimer
  }, [])

  return <div className="heyform-countdown">{parseTime(timeLimit)}</div>
}
