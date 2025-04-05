import { helper } from '@heyform-inc/utils'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import 'dayjs/locale/ja'
import 'dayjs/locale/pl'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-hk'
import 'dayjs/locale/zh-tw'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import localeData from 'dayjs/plugin/localeData'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import weekday from 'dayjs/plugin/weekday'

import { DATE_FORMATS } from '@/consts'

dayjs.extend(utc)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(dayOfYear)
dayjs.extend(timezone)
dayjs.extend(weekday)
dayjs.extend(localeData)
dayjs.extend(relativeTime)

export function timeFromNow(timestamp: number, locale: string) {
  return dayjs.unix(timestamp).locale(locale.toLowerCase()).fromNow()
}

export function timeToNow(timestamp: number, locale: string) {
  return dayjs.unix(timestamp).locale(locale.toLowerCase()).toNow(true)
}

export function formatDay(date: Dayjs, locale: string) {
  const lowerLocale = locale.toLowerCase() as keyof typeof DATE_FORMATS
  const formats = DATE_FORMATS[lowerLocale] || DATE_FORMATS.en

  return date.locale(lowerLocale).format(formats.day)
}

export function parseDuration(duration: number) {
  let type = 's'
  let value = duration

  if (value > 3600) {
    type = 'h'
    value = value / 3600
  } else if (value > 60) {
    type = 'm'
    value = value / 60
  }

  return {
    type,
    value
  }
}

export function getTimePeriod() {
  const hour = dayjs().hour()

  let timePeriod = ''

  if (hour >= 0 && hour < 12) {
    timePeriod = 'morning'
  } else if (hour >= 12 && hour < 18) {
    timePeriod = 'afternoon'
  } else {
    timePeriod = 'evening'
  }

  return timePeriod
}

export function unixDate(unix: number) {
  return dayjs.unix(unix)
}

export function unixToDayjs(unix: number, timezone?: string) {
  const date = dayjs.unix(unix)

  if (timezone) {
    return date.tz(timezone)
  }

  return date
}

export function getTimeZone() {
  return dayjs.tz.guess()
}

export function getWeekNames(locale: string) {
  return dayjs().locale(locale).localeData().weekdaysMin()
}

export function getMonthNames(locale: string) {
  return dayjs().locale(locale).localeData().monthsShort()
}

export function isValidDayjs(date?: Dayjs) {
  return helper.isValid(date) && (date as Dayjs).isValid()
}
