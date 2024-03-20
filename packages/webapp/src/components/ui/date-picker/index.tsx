import clsx from 'clsx'
import dayjs, { Dayjs } from 'dayjs'
import {
  CSSProperties,
  FC,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import Input from '../input/Input'
import Popup from '../popup'
import { stopPropagation } from '../utils'
import Calendar from './Calendar'
import { TimePicker } from './TimePicker'
import {
  DATEPICKER_POPPER_OPTIONS,
  DatePickerCommonOptions,
  MONTH_UNIT,
  WeekDayEnum,
  YEAR_INTERVAL,
  YEAR_UNIT
} from './common'
import { DatePickerStore } from './store'
import { getStartYear, isValidDate } from './utils'

export interface DatePickerProps extends DatePickerCommonOptions {
  className?: string
  popupClassName?: string
  style?: CSSProperties
  placeholder?: string
  showToday?: boolean
  format?: string
  timeFormat?: string
  showTimeSelect?: boolean
  value?: Dayjs
  onChange?: (value: Dayjs) => void
}

const WEEKS_IN_CALENDAR = 6
const MINUTES_INTERVAL = 30

const DatePicker: FC<DatePickerProps> = ({
  className,
  popupClassName,
  format: dateFormat = 'MMM DD, YYYY',
  timeFormat = 'hh:mm A',
  minDate,
  maxDate,
  weekStartsOn = WeekDayEnum.SUNDAY,
  placeholder,
  showToday,
  showTimeSelect,
  weeksInCalendar = WEEKS_IN_CALENDAR,
  minutesInterval = MINUTES_INTERVAL,
  value: rawValue,
  onChange,
  ...restProps
}) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [temp, setTemp] = useState(dayjs())
  const [current, setCurrent] = useState(dayjs())
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [value, setValue] = useState<Dayjs>()
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const format = useMemo(
    () => (showTimeSelect ? [dateFormat, timeFormat].join(' ') : dateFormat),
    [dateFormat, timeFormat, showTimeSelect]
  )

  const toggleYearPicker = useCallback(() => {
    if (isYearPickerOpen) {
      setIsYearPickerOpen(false)
    } else {
      setIsYearPickerOpen(true)
      setIsMonthPickerOpen(false)
    }
  }, [isYearPickerOpen, isMonthPickerOpen])

  const toggleMonthPicker = useCallback(() => {
    if (isMonthPickerOpen) {
      setIsMonthPickerOpen(false)
    } else {
      setIsMonthPickerOpen(true)
      setIsYearPickerOpen(false)
    }
  }, [isYearPickerOpen, isMonthPickerOpen])

  const togglePicker = useCallback(() => {
    if (isYearPickerOpen) {
      setIsYearPickerOpen(false)
    } else if (isMonthPickerOpen) {
      setIsMonthPickerOpen(false)
    } else {
      setIsMonthPickerOpen(true)
    }
  }, [isYearPickerOpen, isMonthPickerOpen])

  const toPrevious = useCallback(() => {
    startTransition(() => {
      if (isYearPickerOpen) {
        setTemp(temp.year(getStartYear(temp) - YEAR_INTERVAL))
      } else if (isMonthPickerOpen) {
        setTemp(temp.subtract(1, YEAR_UNIT))
      } else {
        setCurrent(current.subtract(1, MONTH_UNIT))
        setTemp(temp.subtract(1, MONTH_UNIT))
      }
    })
  }, [current, temp, isYearPickerOpen, isMonthPickerOpen])

  const toNext = useCallback(() => {
    startTransition(() => {
      if (isYearPickerOpen) {
        setTemp(temp.year(getStartYear(temp) + YEAR_INTERVAL))
      } else if (isMonthPickerOpen) {
        setTemp(temp.add(1, YEAR_UNIT))
      } else {
        setCurrent(current.add(1, MONTH_UNIT))
        setTemp(temp.add(1, MONTH_UNIT))
      }
    })
  }, [current, temp, isYearPickerOpen, isMonthPickerOpen])

  const updateYear = useCallback(
    (year: number) => {
      startTransition(() => {
        setTemp(temp.year(year))
        setCurrent(current.year(year))
        setIsYearPickerOpen(false)
      })
    },
    [temp]
  )

  const updateMonth = useCallback(
    (month: number) => {
      startTransition(() => {
        setTemp(temp.month(month))
        setCurrent(current.month(month))
        setIsMonthPickerOpen(false)
      })
    },
    [current]
  )

  const adjustDate = useCallback(
    (dateValue: Dayjs) => {
      let newValue = dateValue

      if (isValidDate(minDate!) && newValue.isBefore(minDate!)) {
        newValue = minDate!
      } else if (isValidDate(maxDate!) && newValue.isAfter(maxDate!)) {
        newValue = maxDate!
      }

      return newValue
    },
    [minDate, maxDate]
  )

  const updateValue = useCallback((date: Dayjs) => {
    startTransition(() => {
      onChange?.(adjustDate(date))
    })
  }, [])

  const handleClick = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleInputBlur = useCallback(() => {
    const date = adjustDate(dayjs(inputValue, format))
    let newValue: string

    if (date.isValid()) {
      newValue = date.format(format)
    } else {
      newValue = value?.format(format) || ''
    }

    setInputValue(newValue)
    onChange?.(date)
  }, [inputValue, value, format])

  const handleInputChange = useCallback(
    (newInputValue: any) => {
      const date = dayjs(newInputValue, format)

      if (date.isValid()) {
        setTemp(date)
        setCurrent(date)
      }

      setInputValue(newInputValue)
    },
    [format]
  )

  const handleTodayClick = useCallback(() => {
    updateValue(dayjs())

    if (!showTimeSelect) {
      setIsOpen(false)
    }
  }, [])

  const handleExited = useCallback(() => {
    setIsOpen(false)
  }, [])

  const Overlay = useMemo(() => {
    return (
      <div className={clsx('datepicker-dropdown', popupClassName)} onClick={stopPropagation}>
        <div className="datepicker-container">
          <Calendar />
          {showTimeSelect && <TimePicker />}
        </div>
        {showToday && (
          <div className="datepicker-today">
            <button className="datepicker-button" onClick={handleTodayClick}>
              Today
            </button>
          </div>
        )}
      </div>
    )
  }, [showToday, value])

  useEffect(() => {
    if (isValidDate(rawValue!)) {
      const newValue = adjustDate(rawValue!)

      setValue(newValue!)
      setTemp(newValue!)
      setCurrent(newValue!)
    }
  }, [rawValue, minDate, maxDate])

  useEffect(() => {
    setInputValue(isValidDate(value!) ? value!.format(format) : '')
  }, [format, value])

  return (
    <DatePickerStore.Provider
      value={{
        value,
        temp,
        current,
        minDate,
        maxDate,
        weeksInCalendar,
        minutesInterval,
        weekStartsOn,
        format,
        timeFormat,
        isYearPickerOpen,
        isMonthPickerOpen,
        togglePicker,
        toggleYearPicker,
        toggleMonthPicker,
        toPrevious,
        toNext,
        updateYear,
        updateMonth,
        updateValue,
        setIsOpen
      }}
    >
      <div
        ref={setRef}
        className={clsx('datepicker', className)}
        onClick={handleClick}
        {...restProps}
      >
        <Input
          value={inputValue}
          placeholder={placeholder}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
        />
      </div>

      <Popup
        visible={isOpen}
        referenceRef={ref as Element}
        popperOptions={DATEPICKER_POPPER_OPTIONS}
        onExited={handleExited}
      >
        {Overlay}
      </Popup>
    </DatePickerStore.Provider>
  )
}

export default DatePicker
