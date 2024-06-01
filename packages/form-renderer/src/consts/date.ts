import { AnyMap } from '../typings'

export const DATE_FORMATS: AnyMap<string[]> = {
  'MM/DD/YYYY': ['MM', 'DD', 'YYYY', '/'],
  'DD/MM/YYYY': ['DD', 'MM', 'YYYY', '/'],
  'YYYY/MM/DD': ['YYYY', 'MM', 'DD', '/'],
  'MM-DD-YYYY': ['MM', 'DD', 'YYYY', '-'],
  'DD-MM-YYYY': ['DD', 'MM', 'YYYY', '-'],
  'YYYY-MM-DD': ['YYYY', 'MM', 'DD', '-'],
  'MM.DD.YYYY': ['MM', 'DD', 'YYYY', '.'],
  'DD.MM.YYYY': ['DD', 'MM', 'YYYY', '.'],
  'YYYY.MM.DD': ['YYYY', 'MM', 'DD', '.'],
  'HH:mm': ['HH', 'mm', ':']
}

export const TIME_FORMAT = 'HH:mm'

export const DATE_MAPS: AnyMap = {
  YYYY: {
    id: 'year',
    label: 'Year',
    minValue: 1000,
    maxValue: 9999,
    maxLength: 4
  },
  MM: {
    id: 'month',
    label: 'Month',
    minValue: 1,
    maxValue: 12,
    maxLength: 2
  },
  DD: {
    id: 'day',
    label: 'Day',
    minValue: 1,
    maxValue: 31,
    maxLength: 2
  },
  HH: {
    id: 'hour',
    label: 'Hour',
    minValue: 0,
    maxValue: 23,
    maxLength: 2
  },
  mm: {
    id: 'minute',
    label: 'Minute',
    minValue: 0,
    maxValue: 59,
    maxLength: 2
  }
}

export const FILTER_NUMBER_REGEX = /[^\d]/g
export const NUMERIC_REGEX = /^\d+$/
