import { getDateFormat } from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'

import { DATE_MAPS } from '../consts'
import { AnyMap } from '../typings'

const REGEX_FORMAT = /\[([^\][]+)]|Y{4}|M{2}|D{2}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g
const REGEX_NUMBERS = /(\d){1,4}/g

function padding(value: string | number, maxLength: number) {
  return String(value).padStart(maxLength, '0')
}

type DateParts = Record<string, number>

function isValidDateParts(parts: DateParts): boolean {
  if (!parts.YYYY || !parts.MM || !parts.DD) {
    return false
  }

  const date = new Date(parts.YYYY, parts.MM - 1, parts.DD, parts.HH ?? 0, parts.mm ?? 0)

  if (parts.HH !== undefined && parts.mm !== undefined) {
    return (
      date.getFullYear() === parts.YYYY &&
      date.getMonth() === parts.MM - 1 &&
      date.getDate() === parts.DD &&
      date.getHours() === parts.HH &&
      date.getMinutes() === parts.mm
    )
  }

  return (
    date.getFullYear() === parts.YYYY &&
    date.getMonth() === parts.MM - 1 &&
    date.getDate() === parts.DD
  )
}

function parseDateParts(value: string, format: string): DateParts | null {
  const inputArr = value.match(REGEX_NUMBERS)
  const formatArr = format.match(REGEX_FORMAT)

  if (!inputArr || !formatArr || inputArr.length !== formatArr.length) {
    return null
  }

  const parts: DateParts = {}

  formatArr.forEach((key, index) => {
    parts[key] = Number(inputArr[index])
  })

  return isValidDateParts(parts) ? parts : null
}

export function parseStoredDate(
  value?: string,
  format = 'MM/DD/YYYY',
  allowTime?: boolean
): AnyMap<string> {
  if (helper.isValid(value)) {
    const parseFormat = getDateFormat(format, allowTime)
    const parts = parseDateParts(value as string, parseFormat)

    if (parts) {
      const result: AnyMap<string> = {
        YYYY: padding(parts.YYYY, DATE_MAPS.YYYY.maxLength),
        MM: padding(parts.MM, DATE_MAPS.MM.maxLength),
        DD: padding(parts.DD, DATE_MAPS.DD.maxLength)
      }

      if (allowTime && parts.HH !== undefined && parts.mm !== undefined) {
        result.HH = padding(parts.HH, DATE_MAPS.HH.maxLength)
        result.mm = padding(parts.mm, DATE_MAPS.mm.maxLength)
      }

      return result
    }
  }

  return {}
}
