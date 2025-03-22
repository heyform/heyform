import { Content, Portal, Root, Trigger } from '@radix-ui/react-popover'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight
} from '@tabler/icons-react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  FC,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useTranslation } from 'react-i18next'
import { createStore as createZStore, useStore as useZStore } from 'zustand'
import computed from 'zustand-computed'
import { immer } from 'zustand/middleware/immer'

import { DATE_FORMATS } from '@/consts'
import { cn, isValidDayjs, nextTick, scrollIntoViewIfNeeded } from '@/utils'

import { Input, InputProps } from './Input'

interface DateRangeProps {
  minDate?: Dayjs
  maxDate?: Dayjs
  startDate?: Dayjs
  endDate?: Dayjs
  selectsStart?: boolean
  selectsEnd?: boolean
}

interface SharedProps extends DateRangeProps {
  locale: string
  weekStartsOn: number
  timeIntervals: number
  value?: Dayjs
  pendingDate: Dayjs
  selectedDate: Dayjs
  isYearPickerOpen?: boolean
  isMonthPickerOpen?: boolean
  onChange?: (date: Dayjs) => void
}

interface ComputedStoreType {
  format: (typeof DATE_FORMATS)['en']
  localeDateString: string
}

interface StoreType extends SharedProps {
  updateState: (updates: Partial<SharedProps>) => void
  togglePicker: () => void
  toggleYearPicker: () => void
  toggleMonthPicker: () => void
  toPrevious: () => void
  toNext: () => void
  updateYear: (year: number) => void
  updateMonth: (month: number) => void
  setValue: (value?: Dayjs) => void
  updateValue: (date: Dayjs, callback?: (date: Dayjs, localeDateString: string) => void) => void
}

interface DateType {
  $: Dayjs
  isToday: boolean
  isSelected: boolean
  isOutOfMonth: boolean
  isDisabled: boolean
  isInRange: boolean
  isoString: string
}

interface TimeType {
  $: Dayjs
  isSelected: boolean
  isDisabled: boolean
  isoString: string
}

interface MonthType {
  value: number
  label: string
  ariaLabel?: string
}

interface GetAdjustDateOptions {
  timeIntervals: number
  minDate?: Dayjs
  maxDate?: Dayjs
}

interface DateInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  onFocusChange: (isFocused: boolean) => void
}

interface DatePickerProps
  extends Optional<
      SharedProps,
      'locale' | 'weekStartsOn' | 'timeIntervals' | 'pendingDate' | 'selectedDate'
    >,
    Omit<ComponentProps, 'onChange'> {
  placeholder?: string
  showTimeSelect?: boolean
}

const DAY_UNIT = 'day'
const MONTH_UNIT = 'month'
const YEAR_UNIT = 'year'
const YEAR_RANGE = 20
const DAYS_IN_WEEK = 7
const WEEKS_IN_CALENDAR = 6

const JZ_LOCALES = ['ja', 'zh-cn', 'zh-tw']

// Sunday is 0, Monday is 1, and so on
const WEEKS = [0, 1, 2, 3, 4, 5, 6]
// January is 0, February is 1, and so on
const MONTHS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11]
]

function getLocaleFormat(locale: string) {
  return DATE_FORMATS[locale as keyof typeof DATE_FORMATS] || DATE_FORMATS.en
}

function isOutOfDateRange(day: Dayjs, { minDate, maxDate }: DateRangeProps) {
  return (
    (isValidDayjs(minDate) && day.isBefore(minDate, DAY_UNIT)) ||
    (isValidDayjs(maxDate) && day.isAfter(maxDate, DAY_UNIT))
  )
}

function isSameDay(date: Dayjs, otherDate: Dayjs) {
  return date.isSame(otherDate, DAY_UNIT)
}

function isSameMonth(date: Dayjs, otherDate: Dayjs) {
  return date.isSame(otherDate, MONTH_UNIT)
}

function isInRange(date: Dayjs, options: DateRangeProps) {
  if (isValidDayjs(options.startDate) && isValidDayjs(options.endDate)) {
    if (options.selectsStart || options.selectsEnd) {
      return date.isAfter(options.startDate) && date.isBefore(options.endDate)
    }
  }

  return false
}

function isDayDisabled(day: Dayjs, options: DateRangeProps) {
  if (options.selectsStart || options.selectsEnd) {
    return false
  }

  return isOutOfDateRange(day, options)
}

function isInDay(date: Dayjs, min: Dayjs, max: Dayjs) {
  if (isValidDayjs(date)) {
    return !(date.isBefore(min) || date.isAfter(max))
  }
  return false
}

function getDatesOfMonth(
  selectedDate: Dayjs,
  selected: Dayjs,
  options: DateRangeProps & Pick<SharedProps, 'weekStartsOn'>
): DateType[] {
  const weekStartsOn = options.weekStartsOn ?? 0

  const firstDayOfMonth = selectedDate.startOf(MONTH_UNIT)
  const firstDayWeek = firstDayOfMonth.day()
  const lastMonthOffset = firstDayWeek >= weekStartsOn ? weekStartsOn - firstDayWeek : -weekStartsOn

  let start = firstDayOfMonth.add(lastMonthOffset, DAY_UNIT)
  const end = firstDayOfMonth.add(lastMonthOffset + WEEKS_IN_CALENDAR * DAYS_IN_WEEK, DAY_UNIT)
  const dates: DateType[] = []
  const today = dayjs()

  while (start.isSameOrBefore(end)) {
    dates.push({
      $: start.clone(),
      isSelected:
        (isValidDayjs(selected) && isSameDay(selected, start)) ||
        (isValidDayjs(options.startDate) && isSameDay(options.startDate as Dayjs, start)) ||
        (isValidDayjs(options.endDate) && isSameDay(options.endDate as Dayjs, start)),
      isToday: isSameDay(today, start),
      isOutOfMonth: !isSameMonth(selectedDate, start),
      isDisabled: isDayDisabled(start, options),
      isInRange: isInRange(start, options),
      isoString: start.toISOString()
    })

    start = start.add(1, DAY_UNIT)
  }

  return dates
}

function getTimesBetweenDates(
  currentDate?: Dayjs,
  minDate?: Dayjs,
  maxDate?: Dayjs,
  timeIntervals = 30
): TimeType[] {
  const selectedDate = isValidDayjs(currentDate as Dayjs) ? (currentDate as Dayjs) : dayjs()

  let min = selectedDate.startOf('day').clone()
  let max = selectedDate.endOf('day').clone()

  if (isInDay(minDate as Dayjs, min, max)) {
    min = (minDate as Dayjs).minute(
      Math.ceil((minDate as Dayjs).minute() / timeIntervals) * timeIntervals
    )
  }

  if (isInDay(maxDate as Dayjs, min, max)) {
    max = maxDate as Dayjs
  }

  let start = min.clone()
  const result: TimeType[] = []

  while (start.isSameOrBefore(max)) {
    result.push({
      $: start,
      isSelected: start.isSame(selectedDate),
      isDisabled: isOutOfDateRange(start, { minDate, maxDate }),
      isoString: start.toISOString()
    })
    start = start.add(timeIntervals, 'minute')
  }

  return result
}

function getNearestMinutes(date: Dayjs, timeIntervals: number) {
  const minutes = Math.round(date.minute() / timeIntervals) * timeIntervals

  return date.startOf('hour').add(minutes, 'minute')
}

function getStartYear(date: Dayjs): number {
  const year = date.year()
  return year - (year % YEAR_RANGE)
}

function getAdjustDate(date: Dayjs, { timeIntervals, minDate, maxDate }: GetAdjustDateOptions) {
  let result = date

  if (isValidDayjs(minDate) && result.isBefore(minDate)) {
    result = minDate as Dayjs
  } else if (isValidDayjs(maxDate) && result.isAfter(maxDate)) {
    result = maxDate as Dayjs
  }

  return getNearestMinutes(result, timeIntervals)
}

const computeState = (state: StoreType): ComputedStoreType => {
  const format = DATE_FORMATS[state.locale as keyof typeof DATE_FORMATS] || DATE_FORMATS.en
  const localeDateString = isValidDayjs(state.value)
    ? (state.value as Dayjs).format(format.date)
    : ''

  return {
    format,
    localeDateString
  }
}

const createStore = (initialState: SharedProps) => {
  return createZStore<StoreType>()(
    computed(
      immer(set => ({
        ...initialState,

        updateState(updates: Partial<SharedProps>) {
          set(state => {
            const keys = Object.keys(updates) as (keyof SharedProps)[]

            keys.forEach(key => {
              ;(state as Any)[key] = updates[key]
            })
          })
        },

        togglePicker() {
          set(state => {
            if (state.isYearPickerOpen) {
              state.isYearPickerOpen = false
            } else {
              state.isMonthPickerOpen = !state.isMonthPickerOpen
            }
          })
        },

        toggleYearPicker() {
          set(state => {
            if (state.isYearPickerOpen) {
              state.isYearPickerOpen = false
            } else {
              state.isYearPickerOpen = true
              state.isMonthPickerOpen = false
            }
          })
        },

        toggleMonthPicker() {
          set(state => {
            if (state.isMonthPickerOpen) {
              state.isMonthPickerOpen = false
            } else {
              state.isMonthPickerOpen = true
              state.isYearPickerOpen = false
            }
          })
        },

        toPrevious() {
          set(state => {
            if (state.isYearPickerOpen) {
              state.pendingDate = state.pendingDate.year(
                getStartYear(state.pendingDate) - YEAR_RANGE
              )
            } else if (state.isMonthPickerOpen) {
              state.pendingDate = state.pendingDate.subtract(1, YEAR_UNIT)
            } else {
              state.selectedDate = state.selectedDate.subtract(1, MONTH_UNIT)
              state.pendingDate = state.pendingDate.subtract(1, MONTH_UNIT)
            }
          })
        },

        toNext() {
          set(state => {
            if (state.isYearPickerOpen) {
              state.pendingDate = state.pendingDate.year(
                getStartYear(state.pendingDate) + YEAR_RANGE
              )
            } else if (state.isMonthPickerOpen) {
              state.pendingDate = state.pendingDate.add(1, YEAR_UNIT)
            } else {
              state.selectedDate = state.selectedDate.add(1, MONTH_UNIT)
              state.pendingDate = state.pendingDate.add(1, MONTH_UNIT)
            }
          })
        },

        updateYear(year) {
          set(state => {
            state.pendingDate = state.pendingDate.year(year)
            state.selectedDate = state.selectedDate.year(year)
            state.isYearPickerOpen = false
          })
        },

        updateMonth(month) {
          set(state => {
            state.pendingDate = state.pendingDate.month(month)
            state.selectedDate = state.selectedDate.month(month)
            state.isMonthPickerOpen = false
          })
        },

        setValue(value) {
          set(state => {
            if (isValidDayjs(value)) {
              const newValue = getAdjustDate(value as Dayjs, {
                timeIntervals: state.timeIntervals,
                minDate: state.minDate,
                maxDate: state.maxDate
              })

              state.value = newValue
              state.pendingDate = newValue
              state.selectedDate = newValue
            }
          })
        },

        updateValue(date, callback) {
          set(state => {
            if (isValidDayjs(date)) {
              const newDate = getAdjustDate(date, {
                timeIntervals: state.timeIntervals,
                minDate: state.minDate,
                maxDate: state.maxDate
              })

              state.onChange?.(newDate)
            } else {
              callback?.(date, (state as unknown as ComputedStoreType).localeDateString)
            }
          })
        }
      })),
      computeState
    )
  )
}

const Context = createContext<StoreType | null>(null)

const useStore = () => {
  const store = useContext(Context)

  return useZStore<Any, StoreType & ComputedStoreType>(
    store,
    state => state as StoreType & ComputedStoreType
  )
}

const Navigation = () => {
  const {
    locale,
    pendingDate,
    isYearPickerOpen,
    isMonthPickerOpen,
    togglePicker,
    toggleYearPicker,
    toggleMonthPicker,
    toPrevious,
    toNext
  } = useStore()

  const { format, isJZLocale } = useMemo(
    () => ({
      format: getLocaleFormat(locale),
      isJZLocale: JZ_LOCALES.includes(locale)
    }),
    [locale]
  )
  const isOpen = useMemo(
    () => isYearPickerOpen || isMonthPickerOpen,
    [isMonthPickerOpen, isYearPickerOpen]
  )

  return (
    <div className="flex items-center justify-between px-3.5 pb-2">
      <div className="flex items-center gap-x-1">
        <div
          className={cn('flex items-center gap-x-1', {
            'flex-reverse': isJZLocale
          })}
        >
          <button
            type="button"
            tabIndex={-1}
            className="rounded p-0.5 text-sm/6 font-medium hover:bg-accent-light"
            onClick={toggleMonthPicker}
          >
            {pendingDate.locale(locale).format(format.month)}
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="rounded p-0.5 text-sm/6 font-medium hover:bg-accent-light"
            onClick={toggleYearPicker}
          >
            {pendingDate.locale(locale).format(format.year)}
          </button>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="rounded p-0.5 text-primary transition-transform duration-200 ease-in-out hover:bg-accent-light data-[state=open]:rotate-180"
          data-state={isOpen ? 'open' : 'close'}
          onClick={togglePicker}
        >
          <IconChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="-mr-1 flex items-center gap-x-2.5">
        <button
          type="button"
          tabIndex={-1}
          className="rounded p-0.5 text-primary hover:bg-accent-light"
          onClick={toPrevious}
        >
          {isOpen ? (
            <IconChevronsLeft className="h-4 w-4" />
          ) : (
            <IconChevronLeft className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="rounded p-0.5 text-primary hover:bg-accent-light"
          onClick={toNext}
        >
          {isOpen ? (
            <IconChevronsRight className="h-4 w-4" />
          ) : (
            <IconChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}

const YearCell: FC<{ year: number }> = ({ year }) => {
  const { selectedDate, updateYear } = useStore()
  const isSelected = useMemo(() => selectedDate.year() === year, [selectedDate, year])

  function handleClick() {
    updateYear(year)
  }

  return (
    <button
      type="button"
      name="year"
      role="gridcell"
      className={cn('h-9 rounded px-2 hover:bg-accent-light', {
        'bg-primary text-foreground hover:bg-primary': isSelected
      })}
      aria-selected={isSelected}
      tabIndex={-1}
      onClick={handleClick}
    >
      {year}
    </button>
  )
}

const YearPicker = () => {
  const { pendingDate } = useStore()

  const years = useMemo(() => {
    const startYear = getStartYear(pendingDate)
    const arr = Array.from({ length: YEAR_RANGE }, (_, index) => startYear + index)

    return Array.from({ length: 5 }, (_, index) => {
      return arr.slice(index * 4, (index + 1) * 4)
    })
  }, [pendingDate])

  return (
    <div className="flex flex-1 flex-col justify-between px-2 pt-2">
      {years.map((row, index) => (
        <div key={index} className="flex items-center justify-between">
          {row.map(year => (
            <YearCell key={year} year={year} />
          ))}
        </div>
      ))}
    </div>
  )
}

const MonthCell: FC<{ month: MonthType }> = ({ month }) => {
  const { pendingDate, selectedDate, updateMonth } = useStore()
  const isSelected = useMemo(
    () => isSameMonth(pendingDate, selectedDate) && selectedDate.month() === month.value,
    [month.value, pendingDate, selectedDate]
  )

  function handleClick() {
    updateMonth(month.value)
  }

  return (
    <button
      type="button"
      name="month"
      role="gridcell"
      className={cn('h-9 rounded px-3.5 hover:bg-accent-light', {
        'bg-primary text-foreground hover:bg-primary': isSelected
      })}
      aria-selected={isSelected}
      aria-label={month.ariaLabel}
      tabIndex={-1}
      onClick={handleClick}
    >
      {month.label}
    </button>
  )
}

const MonthPicker = () => {
  const { locale } = useStore()

  const months = useMemo(() => {
    const monthsShort = dayjs().locale(locale).localeData().monthsShort()
    const months = dayjs().locale(locale).localeData().months()

    return MONTHS.map(row =>
      row.map(value => ({
        label: monthsShort[value],
        ariaLabel: months[value],
        value
      }))
    )
  }, [locale])

  return (
    <div className="flex flex-1 flex-col justify-between px-2 pt-2">
      {months.map((row, index) => (
        <div key={index} className="flex items-center justify-between">
          {row.map(m => (
            <MonthCell key={m.value} month={m} />
          ))}
        </div>
      ))}
    </div>
  )
}

const WeekView = () => {
  const { locale, weekStartsOn } = useStore()

  const weeks = useMemo(() => {
    const index = WEEKS.findIndex(w => w === weekStartsOn)

    const weekdaysMin = dayjs().locale(locale).localeData().weekdaysMin()
    const weekdays = dayjs().locale(locale).localeData().weekdays()

    return [...WEEKS.slice(index), ...WEEKS.slice(0, index)].map(value => ({
      value,
      label: weekdaysMin[value],
      ariaLabel: weekdays[value]
    }))
  }, [locale, weekStartsOn])

  return (
    <div className="flex items-center px-2 py-1 text-sm/6 text-secondary">
      {weeks.map(row => (
        <div key={row.value} className="w-9 text-center" aria-label={row.ariaLabel}>
          {row.label}
        </div>
      ))}
    </div>
  )
}

const DayCell: FC<{ date: DateType }> = ({ date }) => {
  const { updateValue, value } = useStore()

  const handleClick = useCallback(() => {
    let newValue = date.$

    // Don't change hour/minute
    if (value) {
      newValue = newValue.hour(value.hour()).minute(value.minute()).clone()
    }

    updateValue(newValue)
  }, [date.$, updateValue, value])

  return (
    <div
      key={date.isoString}
      className={cn({
        'bg-accent-light': date.isInRange
      })}
    >
      <button
        type="button"
        name="day"
        role="gridcell"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded border border-transparent text-sm/6 hover:bg-accent-light',
          {
            'text-secondary': date.isOutOfMonth,
            'border-accent': date.isToday,
            'bg-primary text-foreground hover:bg-primary': date.isSelected,
            'pointer-events-none': date.isDisabled
          }
        )}
        disabled={date.isDisabled}
        tabIndex={-1}
        aria-selected={date.isInRange || date.isSelected}
        onClick={handleClick}
      >
        {date.$.date()}
      </button>
    </div>
  )
}

const MonthView = () => {
  const {
    value,
    selectedDate,
    minDate,
    maxDate,
    selectsStart,
    selectsEnd,
    startDate,
    endDate,
    weekStartsOn
  } = useStore()

  const weeks: DateType[][] = useMemo(() => {
    const dates = getDatesOfMonth(selectedDate, value as Dayjs, {
      minDate,
      maxDate,
      selectsStart,
      selectsEnd,
      startDate,
      endDate,
      weekStartsOn
    })

    return Array.from({ length: WEEKS_IN_CALENDAR }).map((_, index) =>
      dates.slice(index * DAYS_IN_WEEK, (index + 1) * DAYS_IN_WEEK)
    )
  }, [
    selectedDate,
    value,
    minDate,
    maxDate,
    selectsStart,
    selectsEnd,
    startDate,
    endDate,
    weekStartsOn
  ])

  return (
    <div>
      <WeekView />

      <div className="space-y-1">
        {weeks.map((dates, index) => (
          <div key={index} className="flex items-center px-2">
            {dates.map(date => (
              <DayCell key={date.isoString} date={date} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const MonthPanel = () => {
  const { isYearPickerOpen, isMonthPickerOpen } = useStore()

  const children = useMemo(
    () => (isYearPickerOpen ? <YearPicker /> : isMonthPickerOpen ? <MonthPicker /> : <MonthView />),
    [isMonthPickerOpen, isYearPickerOpen]
  )

  return (
    <div className="flex h-[21rem] w-[17.75rem] flex-col px-2 py-4">
      <Navigation />
      {children}
    </div>
  )
}

interface TimeCellProps {
  time: TimeType
  timeFormat: string
}

const TimeCell: FC<TimeCellProps> = ({ time, timeFormat }) => {
  const { locale, updateValue } = useStore()

  const handleClick = useCallback(() => {
    updateValue(time.$)
  }, [time.$, updateValue])

  return (
    <li
      className="px-1"
      data-selected={time.isSelected ? '' : undefined}
      style={{
        paddingInlineStart: '1rem'
      }}
    >
      <button
        type="button"
        name="time"
        tabIndex={-1}
        key={time.isoString}
        className={cn('block rounded px-2 py-0.5 text-sm/6 hover:bg-accent-light', {
          'bg-primary text-foreground hover:bg-primary': time.isSelected,
          'pointer-events-none': time.isDisabled
        })}
        disabled={time.isDisabled}
        aria-selected={time.isSelected}
        onClick={handleClick}
      >
        {time.$.locale(locale).format(timeFormat)}
      </button>
    </li>
  )
}

const TimePanel = () => {
  const { t } = useTranslation()

  const { value, format, minDate, maxDate, timeIntervals } = useStore()
  const listRef = useRef<Any>(undefined)

  const options = useMemo(
    () => getTimesBetweenDates(value, minDate, maxDate, timeIntervals),
    [value, minDate, maxDate, timeIntervals]
  )

  useLayoutEffect(() => {
    if (listRef.current) {
      scrollIntoViewIfNeeded(listRef.current, listRef.current.querySelector('li[data-selected]'))
    }
  }, [value, listRef])

  return (
    <div className="flex h-[21rem] flex-col border-l border-accent-light">
      <div className="pb-2 pt-4">
        <div className="text-center text-sm/6">{t('components.datePicker.time')}</div>
      </div>
      <ul ref={listRef} className="scrollbar flex-1 pb-5 pt-1">
        {options.map(row => (
          <TimeCell key={row.isoString} time={row} timeFormat={format.time} />
        ))}
      </ul>
    </div>
  )
}

const DateInput: FC<DateInputProps> = ({ onFocusChange, ...restProps }) => {
  const { localeDateString, updateValue, updateState } = useStore()
  const [value, setValue] = useState(localeDateString)

  const handleInputFocus = useCallback(() => {
    onFocusChange(true)
  }, [onFocusChange])

  const handleInputBlur = useCallback(() => {
    updateValue(dayjs(value), (_, newValue) => {
      setValue(newValue)
    })

    onFocusChange(false)
  }, [onFocusChange, updateValue, value])

  const handleInputChange = useCallback(
    (newValue: string) => {
      const date = dayjs(newValue)

      if (date.isValid()) {
        updateState({
          pendingDate: date,
          selectedDate: date
        })
      }

      setValue(newValue)
    },
    [updateState]
  )

  useEffect(() => {
    setValue(localeDateString)
  }, [localeDateString])

  return (
    <Input
      {...restProps}
      autoComplete="off"
      spellCheck="false"
      value={value}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      onChange={handleInputChange}
    />
  )
}

export const DatePicker: FC<DatePickerProps> = ({
  className,
  placeholder,
  showTimeSelect,
  value,
  ...restProps
}) => {
  const store = useRef(
    createStore({
      locale: 'en',
      weekStartsOn: 0,
      timeIntervals: 30,
      ...restProps,
      pendingDate: dayjs(),
      selectedDate: dayjs()
    })
  ).current

  const focusedRef = useRef(false)
  const [isOpen, setOpen] = useState(false)

  function handleFocusChange(isFocused: boolean) {
    focusedRef.current = isFocused

    if (isFocused) {
      setOpen(isFocused)
    }
  }

  function handleOpenChange(open: boolean) {
    nextTick(() => {
      if (!focusedRef.current && !open) {
        setOpen(open)
      }
    })
  }

  useEffect(() => {
    const properties = ['locale', 'startDate', 'endDate', 'selectsStart', 'selectsEnd']
    const updates: Partial<SharedProps> = {}

    properties.forEach(property => {
      if ((restProps as AnyMap)[property]) {
        ;(updates as AnyMap)[property] = (restProps as AnyMap)[property]
      }
    })

    store.getState().updateState(updates)
  }, [
    store,
    restProps.locale,
    restProps.startDate,
    restProps.endDate,
    restProps.selectsStart,
    restProps.selectsEnd
  ])

  useEffect(() => {
    store.getState().setValue(value)
  }, [store, value])

  return (
    <Context.Provider value={store as unknown as StoreType}>
      <Root open={isOpen} onOpenChange={handleOpenChange}>
        <div className={cn('relative', className)}>
          <DateInput placeholder={placeholder} onFocusChange={handleFocusChange} />
          <Trigger asChild>
            <div className="pointer-events-none absolute inset-0" />
          </Trigger>
        </div>

        <Portal>
          <Content
            className="z-10 origin-top-left rounded-lg bg-foreground text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90"
            sideOffset={8}
            align="start"
          >
            <div className="flex">
              <MonthPanel />
              {showTimeSelect && <TimePanel />}
            </div>
          </Content>
        </Portal>
      </Root>
    </Context.Provider>
  )
}
