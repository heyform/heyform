import { IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import clsx from 'clsx'
import { deepEqual } from 'fast-equals'
import { FC, memo, useCallback, useContext, useMemo } from 'react'

import MonthPicker from './MonthPicker'
import YearPicker from './YearPicker'
import { DAYS_IN_WEEK, DAY_NAMES, DateType, WEEK_DAYS } from './common'
import { DatePickerStore } from './store'
import { getDatesOfMonth } from './utils'

const DownIcon = <IconChevronDown />
const LeftIcon = <IconChevronLeft />
const RightIcon = <IconChevronRight />

const Header = memo(() => {
  const {
    temp,
    isYearPickerOpen,
    isMonthPickerOpen,
    togglePicker,
    toggleYearPicker,
    toggleMonthPicker,
    toPrevious,
    toNext
  } = useContext(DatePickerStore)

  return (
    <div className="datepicker-header">
      <div className="datepicker-current">
        <button className="datepicker-current-month" onClick={toggleMonthPicker}>
          {temp.format('MM')}
        </button>
        <button className="datepicker-current-year" onClick={toggleYearPicker}>
          {temp.format('YYYY')}
        </button>
        <button
          className={clsx('datepicker-button', {
            'datepicker-button-open': isYearPickerOpen || isMonthPickerOpen
          })}
          onClick={togglePicker}
        >
          {DownIcon}
        </button>
      </div>
      <div className="datepicker-navigation">
        <button className="datepicker-button" onClick={toPrevious}>
          {LeftIcon}
        </button>
        <button className="datepicker-button" onClick={toNext}>
          {RightIcon}
        </button>
      </div>
    </div>
  )
})
Header.displayName = 'Header'

const Day = memo<{ date: DateType }>(
  ({ date }) => {
    const { updateValue, value } = useContext(DatePickerStore)

    const handleClick = useCallback(() => {
      let newValue = date.d

      // Don't change hour/minute
      if (value) {
        newValue = value.clone().dayOfYear(date.d.dayOfYear())
      }

      updateValue(newValue)
    }, [value])

    return (
      <div
        key={date.d.toISOString()}
        className={clsx('datepicker-cell', {
          'datepicker-cell-today': date.isToday,
          'datepicker-cell-out-month': date.isOutOfMonth,
          'datepicker-cell-selected': date.isSelected,
          'datepicker-cell-disabled': date.isDisabled
        })}
        onClick={handleClick}
      >
        {date.d.date()}
      </div>
    )
  },
  (prev, next) => {
    return deepEqual(prev.date, next.date)
  }
)
Day.displayName = 'Day'

const Week = memo<{ dates: DateType[] }>(
  ({ dates }) => {
    return (
      <div className="datepicker-row">
        {dates.map(date => (
          <Day key={date.d.toISOString()} date={date} />
        ))}
      </div>
    )
  },
  (prev, next) => {
    return deepEqual(prev.dates, next.dates)
  }
)
Week.displayName = 'Week'

const DayNames = memo(() => {
  const { weekStartsOn } = useContext(DatePickerStore)

  const weekDays = useMemo(() => {
    const index = WEEK_DAYS.findIndex(w => w === weekStartsOn)
    return [...WEEK_DAYS.slice(index), ...WEEK_DAYS.slice(0, index)]
  }, [weekStartsOn])

  return (
    <div className="datepicker-day-names datepicker-row">
      {weekDays.map(w => (
        <div key={w} className="datepicker-cell">
          {DAY_NAMES[w]}
        </div>
      ))}
    </div>
  )
})
DayNames.displayName = 'DayNames'

const Month = memo(() => {
  const { value, current, minDate, maxDate, weekStartsOn, weeksInCalendar } =
    useContext(DatePickerStore)

  const weeks: DateType[][] = useMemo(() => {
    const dates = getDatesOfMonth(current, value!, {
      minDate,
      maxDate,
      weekStartsOn
    })

    return Array.from({ length: weeksInCalendar! }).map((_, index) =>
      dates.slice(index * DAYS_IN_WEEK, (index + 1) * DAYS_IN_WEEK)
    )
  }, [current, value!, minDate, maxDate, weekStartsOn])

  return (
    <div className="datepicker-month-container">
      <DayNames />
      <div className="datepicker-month">
        {weeks.map((dates, index) => (
          <Week key={index} dates={dates} />
        ))}
      </div>
    </div>
  )
})
Month.displayName = 'Month'

const Calendar: FC = () => {
  const { isYearPickerOpen, isMonthPickerOpen } = useContext(DatePickerStore)

  return (
    <div className="datepicker-panel">
      <Header />
      {isYearPickerOpen ? <YearPicker /> : isMonthPickerOpen ? <MonthPicker /> : <Month />}
    </div>
  )
}

export default memo(Calendar)
