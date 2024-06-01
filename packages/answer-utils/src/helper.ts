import { helper } from '@heyform-inc/utils'
import dayjs from 'dayjs'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export { htmlToText } from '@heyform-inc/utils'

export function isNumber(arg: any): boolean {
  return Number.isFinite(arg)
}

export function isMobilePhone(arg: any): boolean {
  const phoneNumber = parsePhoneNumberFromString(arg)
  return !!phoneNumber?.isValid()
}

const REGEX_FORMAT = /\[([^\]]+)]|Y{4}|M{2}|D{2}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g
const REGEX_NUMBERS = /(\d){1,4}/g

export function getDateFormat(format: string, allowTime?: boolean): string {
  return allowTime ? `${format} HH:mm` : format
}

export function isDate(input: string, format = 'MM/DD/YYYY'): boolean {
  const inputArr = input.match(REGEX_NUMBERS)
  const formatArr = format.match(REGEX_FORMAT)

  if (!inputArr || !formatArr || inputArr.length !== formatArr.length) {
    return false
  }

  const dateObject: Record<string, number> = {}

  formatArr.forEach((key, index) => {
    dateObject[key] = Number(inputArr[index])
  })

  const date = new Date(
    dateObject.YYYY,
    dateObject.MM - 1,
    dateObject.DD,
    dateObject.HH || 0,
    dateObject.mm || 0
  )

  if (dateObject.HH && dateObject.mm) {
    return (
      date.getFullYear() === +dateObject.YYYY &&
      date.getMonth() === dateObject.MM - 1 &&
      date.getDate() === dateObject.DD &&
      date.getHours() === dateObject.HH &&
      date.getMinutes() === dateObject.mm
    )
  }

  return (
    date.getFullYear() === +dateObject.YYYY &&
    date.getMonth() === dateObject.MM - 1 &&
    date.getDate() === +dateObject.DD
  )
}

export function isEqual(arg1: unknown, arg2: unknown): boolean {
  if (helper.isArray(arg1) && helper.isArray(arg2)) {
    return arg1.length === arg2.length && arg1.every(e => arg2.includes(e))
  }

  return String(arg1) === String(arg2)
}

export function isContains(arg1: unknown, arg2: unknown): boolean {
  if (helper.isArray(arg1)) {
    return arg1.includes(String(arg2))
  }

  return String(arg1).includes(String(arg2))
}

export function isStartsWith(arg1: unknown, arg2: unknown): boolean {
  return String(arg1).startsWith(String(arg2))
}

export function isEndsWith(arg1: unknown, arg2: unknown): boolean {
  return String(arg1).endsWith(String(arg2))
}

export function isGreaterThan(arg1: unknown, arg2: unknown): boolean {
  return helper.isNumeric(arg1) && helper.isNumeric(arg2) && Number(arg1) > Number(arg2)
}

export function isLessThan(arg1: unknown, arg2: unknown): boolean {
  return helper.isNumeric(arg1) && helper.isNumeric(arg2) && Number(arg1) < Number(arg2)
}

export function isGreaterOrEqualThan(arg1: unknown, arg2: unknown): boolean {
  return helper.isNumeric(arg1) && helper.isNumeric(arg2) && Number(arg1) >= Number(arg2)
}

export function isLessOrEqualThan(arg1: unknown, arg2: unknown): boolean {
  return helper.isNumeric(arg1) && helper.isNumeric(arg2) && Number(arg1) <= Number(arg2)
}

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'

export function isSameDate(
  value: string,
  expected: string,
  format = DEFAULT_DATE_FORMAT,
  allowTime = false
): boolean {
  const valueFormat = getDateFormat(format, allowTime)
  const expectedFormat = getDateFormat(DEFAULT_DATE_FORMAT, allowTime)

  return dayjs(value, valueFormat).isSame(dayjs(expected, expectedFormat))
}

export function isBeforeDate(
  value: string,
  expected: string,
  format = DEFAULT_DATE_FORMAT,
  allowTime = false
): boolean {
  const valueFormat = getDateFormat(format, allowTime)
  const expectedFormat = getDateFormat(DEFAULT_DATE_FORMAT, allowTime)

  return dayjs(value, valueFormat).isBefore(dayjs(expected, expectedFormat))
}

export function isAfterDate(
  value: string,
  expected: string,
  format = DEFAULT_DATE_FORMAT,
  allowTime = false
): boolean {
  const valueFormat = getDateFormat(format, allowTime)
  const expectedFormat = getDateFormat(DEFAULT_DATE_FORMAT, allowTime)

  return dayjs(value, valueFormat).isAfter(dayjs(expected, expectedFormat))
}
