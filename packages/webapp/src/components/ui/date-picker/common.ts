import { Options as PopperOptions } from '@popperjs/core/lib/types'
import { Dayjs } from 'dayjs'

export enum WeekDayEnum {
  SUNDAY = 0,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY
}

export interface DatePickerCommonOptions {
  minDate?: Dayjs
  maxDate?: Dayjs
  weekStartsOn?: WeekDayEnum
  weeksInCalendar?: number
  minutesInterval?: number
}

export interface DateType {
  d: Dayjs
  isToday: boolean
  isSelected: boolean
  isOutOfMonth: boolean
  isDisabled: boolean
}

export interface TimeType {
  d: Dayjs
  isSelected: boolean
  isDisabled: boolean
}

export const WEEK_DAYS = [
  WeekDayEnum.SUNDAY,
  WeekDayEnum.MONDAY,
  WeekDayEnum.TUESDAY,
  WeekDayEnum.WEDNESDAY,
  WeekDayEnum.THURSDAY,
  WeekDayEnum.FRIDAY,
  WeekDayEnum.SATURDAY
]

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11]
]

export const DAY_UNIT = 'day'
export const MONTH_UNIT = 'month'
export const YEAR_UNIT = 'year'
export const YEAR_INTERVAL = 20
export const DAYS_IN_WEEK = 7

export const DATEPICKER_POPPER_OPTIONS: Partial<PopperOptions> = {
  placement: 'bottom-start',
  strategy: 'fixed',
  modifiers: [
    {
      name: 'computeStyles',
      options: {
        gpuAcceleration: false
      }
    }
  ]
}
