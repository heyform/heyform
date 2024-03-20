const toString = Object.prototype.toString

export function type(obj: any): string {
  if (obj === null) {
    return 'null'
  }

  let type: string = typeof obj

  if (type !== 'object') {
    return type
  }

  type = toString.call(obj).slice(8, -1)

  const typeLower = type.toLowerCase()

  if (typeLower !== 'object') {
    if (
      typeLower === 'number' ||
      typeLower === 'boolean' ||
      typeLower === 'string'
    ) {
      return type
    }
    return typeLower
  }

  return typeLower
}
