import _clone from 'clone'

export function clone<T>(obj: T): T {
  return _clone(obj)
}
