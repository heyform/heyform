import { Property } from '@heyform-inc/shared-types-enums'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

import { helper } from '@heyform-inc/utils'

import { OTHER_CHOICE_LABEL } from './consts'
import dayjs, { Dayjs } from './dayjs'

export { htmlToText } from '@heyform-inc/utils'

export function isNumber(arg: any): boolean {
  return Number.isFinite(arg)
}

export function isMobilePhone(arg: any): boolean {
  // libphonenumber throws on anything but a string
  if (typeof arg !== 'string') {
    return false
  }

  const phoneNumber = parsePhoneNumberFromString(arg)
  return !!phoneNumber?.isValid()
}

// A bracketed literal can't contain "[", so a format full of unclosed "[" is scanned once
// instead of once per bracket (polynomial backtracking)
const REGEX_FORMAT = /\[([^\][]+)]|Y{4}|M{2}|D{2}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g
const REGEX_NUMBERS = /(\d){1,4}/g

export function getDateFormat(format: string, allowTime?: boolean): string {
  return allowTime ? `${format} HH:mm` : format
}

export function isDate(input: string, format = 'MM/DD/YYYY'): boolean {
  // A date range's start/end comes straight from the request and may not be a string
  if (typeof input !== 'string') {
    return false
  }

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

// An unanswered field has no text, so it must not match "undefined" or "null".
function toText(arg: unknown): string {
  return helper.isNil(arg) ? '' : String(arg)
}

export function isContains(arg1: unknown, arg2: unknown): boolean {
  if (helper.isArray(arg1)) {
    return arg1.includes(String(arg2))
  }

  return toText(arg1).includes(String(arg2))
}

export function isStartsWith(arg1: unknown, arg2: unknown): boolean {
  return toText(arg1).startsWith(String(arg2))
}

export function isEndsWith(arg1: unknown, arg2: unknown): boolean {
  return toText(arg1).endsWith(String(arg2))
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

// Strict mode rejects a value that does not match the format, including overflow
// dates such as 31 February that Date.parse would roll into March.
function parseStrictDate(value: unknown, format: string): Dayjs | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const parsed = dayjs(value, format, true)

  return parsed.isValid() ? parsed : undefined
}

// The answer is produced by the date picker, so it is always in the field's format. The condition's
// own date is typed by the form owner, who may have used another shape such as `2026-4-3`, and
// Date.parse used to accept those. Read anything that isn't exactly `YYYY-MM-DD[ HH:mm]`
// leniently, so a condition saved before the format was enforced keeps matching.
function parseExpectedDate(value: unknown, format: string): Dayjs | undefined {
  const strict = parseStrictDate(value, format)

  if (strict) {
    return strict
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const lenient = dayjs(value)

  return lenient.isValid() ? lenient : undefined
}

function compareDates(
  value: string,
  expected: string,
  format: string,
  allowTime: boolean,
  compare: (answer: Dayjs, target: Dayjs) => boolean
): boolean {
  // Day.js reads undefined as now, which differs between the browser and the server
  if (helper.isNil(value)) {
    return false
  }

  const answer = parseStrictDate(value, getDateFormat(format, allowTime))
  const target = parseExpectedDate(expected, getDateFormat(DEFAULT_DATE_FORMAT, allowTime))

  if (!answer || !target) {
    return false
  }

  return compare(answer, target)
}

export function isSameDate(
  value: string,
  expected: string,
  format = DEFAULT_DATE_FORMAT,
  allowTime = false
): boolean {
  return compareDates(value, expected, format, allowTime, (answer, target) => answer.isSame(target))
}

export function isBeforeDate(
  value: string,
  expected: string,
  format = DEFAULT_DATE_FORMAT,
  allowTime = false
): boolean {
  return compareDates(value, expected, format, allowTime, (answer, target) =>
    answer.isBefore(target)
  )
}

export function isAfterDate(
  value: string,
  expected: string,
  format = DEFAULT_DATE_FORMAT,
  allowTime = false
): boolean {
  return compareDates(value, expected, format, allowTime, (answer, target) =>
    answer.isAfter(target)
  )
}

// The respondent's "Other" text, or "Other" itself when they chose it without typing on a
// question that allows that. Pass the properties saved with the answer.
export function otherChoiceText(other?: string | null, properties?: Property): string | undefined {
  if (helper.isValid(other)) {
    return other!
  }

  if (other === '' && properties?.allowOther && properties?.allowBlankOther) {
    return OTHER_CHOICE_LABEL
  }
}
