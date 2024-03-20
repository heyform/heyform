import { helper } from '@heyform-inc/utils'
import dayjs, { Dayjs } from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import {
  DAYS_IN_WEEK,
  DAY_UNIT,
  DatePickerCommonOptions,
  DateType,
  MONTH_UNIT,
  TimeType,
  WeekDayEnum,
  YEAR_INTERVAL
} from './common'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(dayOfYear)

export function isValidDate(date: Dayjs) {
  return helper.isValid(date) && date.isValid()
}

export function isOutOfDateRange(
  day: Dayjs,
  { minDate, maxDate }: Pick<DatePickerCommonOptions, 'minDate' | 'maxDate'>
) {
  return (
    (isValidDate(minDate!) && day.isBefore(minDate!, DAY_UNIT)) ||
    (isValidDate(maxDate!) && day.isAfter(maxDate!, DAY_UNIT))
  )
}

export function isSameDay(date: Dayjs, otherDate: Dayjs) {
  return date.isSame(otherDate, DAY_UNIT)
}

export function isSameMonth(date: Dayjs, otherDate: Dayjs) {
  return date.isSame(otherDate, MONTH_UNIT)
}

export function isDayDisabled(
  day: Dayjs,
  { minDate, maxDate }: Omit<DatePickerCommonOptions, 'weekStartsOn'>
) {
  return isOutOfDateRange(day, { minDate, maxDate }) || false
}

export function isInDay(date: Dayjs, min: Dayjs, max: Dayjs) {
  if (isValidDate(date)) {
    return !(date.isBefore(min) || date.isAfter(max))
  }
  return false
}

export function getDatesOfMonth(
  current: Dayjs,
  selected: Dayjs,
  options: DatePickerCommonOptions
): DateType[] {
  const { minDate, maxDate } = options
  const weekStartsOn = options.weekStartsOn ?? WeekDayEnum.SUNDAY
  const weeksInCalendar = options.weeksInCalendar || 6

  const firstDayOfMonth = current.startOf(MONTH_UNIT)
  const firstDayWeek = firstDayOfMonth.day()
  const lastMonthOffset = firstDayWeek >= weekStartsOn ? weekStartsOn - firstDayWeek : -weekStartsOn

  let start = firstDayOfMonth.add(lastMonthOffset, DAY_UNIT)
  const end = firstDayOfMonth.add(lastMonthOffset + weeksInCalendar * DAYS_IN_WEEK, DAY_UNIT)
  const dates: DateType[] = []
  const today = dayjs()

  while (start.isSameOrBefore(end)) {
    dates.push({
      d: start.clone(),
      isSelected: isValidDate(selected!) && isSameDay(selected!, start),
      isToday: isSameDay(today, start),
      isOutOfMonth: !isSameMonth(current, start),
      isDisabled: isDayDisabled(start, { minDate, maxDate })
    })

    start = start.add(1, DAY_UNIT)
  }

  return dates
}

export function getTimesBetweenDates(
  currentDate?: Dayjs,
  minDate?: Dayjs,
  maxDate?: Dayjs,
  minutesInterval = 30
): TimeType[] {
  const current = isValidDate(currentDate!) ? currentDate! : dayjs()

  let min = current.startOf('day').clone()
  let max = current.endOf('day').clone()

  if (isInDay(minDate!, min, max)) {
    min = minDate!.minute(Math.ceil(minDate!.minute() / minutesInterval) * minutesInterval)
  }

  if (isInDay(maxDate!, min, max)) {
    max = maxDate!
  }

  let start = min.clone()
  const result: TimeType[] = []

  while (start.isSameOrBefore(max)) {
    result.push({
      d: start,
      isSelected: start.isSame(current),
      isDisabled: isOutOfDateRange(start, { minDate, maxDate })
    })
    start = start.add(minutesInterval, 'minute')
  }

  return result
}

export function getStartYear(date: Dayjs): number {
  const year = date.year()
  return year - (year % YEAR_INTERVAL)
}
