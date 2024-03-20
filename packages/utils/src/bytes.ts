import { isEmpty } from './helper'

const BYTE = 1
const KB = BYTE * 1024
const MB = KB * 1024
const GB = MB * 1024
const TB = GB * 1024
const PB = TB * 1024
const regx = /^(-?(?:\d+)?\.?\d+)(b|kb|mb|gb|tb|pb)$/i

export function parseBytes(value: string | number): number | undefined {
  if (isEmpty(value)) {
    return
  }

  const str = String(value)
  const matches = str.match(regx)

  if (!matches) {
    return
  }

  const num = parseFloat(matches[1])
  const type = matches[2].toLowerCase()

  switch (type) {
    case 'pb':
      return num * PB

    case 'tb':
      return num * TB

    case 'gb':
      return num * GB

    case 'mb':
      return num * MB

    case 'kb':
      return num * KB

    case 'b':
      return num * BYTE
  }
}

export function bytes(size: string): number | undefined {
  return parseBytes(size)
}

export function formatBytes(value: string | number): string {
  const mag = Math.abs(Number(value))
  let unit: string
  let size: number | string

  if (mag >= PB) {
    unit = 'PB'
    size = mag / PB
  } else if (mag >= TB) {
    unit = 'TB'
    size = mag / TB
  } else if (mag >= GB) {
    unit = 'GB'
    size = mag / GB
  } else if (mag >= MB) {
    unit = 'MB'
    size = mag / MB
  } else if (mag >= KB) {
    unit = 'KB'
    size = mag / KB
  } else {
    unit = 'B'
    size = mag / BYTE
  }

  if (String(size).includes('.')) {
    size = size.toFixed(1)
  }

  return size + unit
}
