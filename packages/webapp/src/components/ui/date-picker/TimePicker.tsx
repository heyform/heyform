import clsx from 'clsx'
import { deepEqual } from 'fast-equals'
import { FC, memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { stopPropagation } from '../utils'
import { TimeType } from './common'
import { DatePickerStore } from './store'
import { getTimesBetweenDates } from './utils'

interface TimeProps {
  time: TimeType
  timeFormat: string
}

const Time = memo<TimeProps>(
  ({ time, timeFormat }) => {
    const { updateValue, setIsOpen } = useContext(DatePickerStore)

    const handleClick = useCallback(() => {
      updateValue(time.d)
      setIsOpen(false)
    }, [time])

    return (
      <div
        key={time.d.toISOString()}
        className={clsx('select-option', {
          'select-option-active': time.isSelected,
          'select-option-disabled': time.isDisabled
        })}
        onClick={handleClick}
      >
        {time.d.format(timeFormat)}
      </div>
    )
  },
  (prev, next) => {
    return deepEqual(prev.time, next.time)
  }
)
Time.displayName = 'Time'

export const TimePicker: FC = () => {
  const { value, timeFormat, minDate, maxDate, minutesInterval } = useContext(DatePickerStore)
  const listRef = useRef<any>()
	const { t } = useTranslation()

  const options = useMemo(() => {
    return getTimesBetweenDates(value, minDate, maxDate, minutesInterval)
  }, [value, minDate, maxDate, minutesInterval])

  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector('.select-option-active')

      if (activeElement) {
        activeElement.scrollIntoView()
      }
    }
  }, [value, listRef])

  return (
    <div className="timepicker-panel" onClick={stopPropagation}>
      <div className="timepicker-panel-header">{t('formSettings.time')}</div>
      <ul ref={listRef} className="timepicker-options">
        {options.map(time => (
          <Time key={time.d.toISOString()} time={time} timeFormat={timeFormat!} />
        ))}
      </ul>
    </div>
  )
}
