import type { CalculatedColumn } from '../types'

export * from '../utils/keyboardUtils'
export * from '../utils/selectedCellUtils'

export function assertIsValidKeyGetter<R>(
  keyGetter: unknown
): asserts keyGetter is (row: R) => React.Key {
  if (typeof keyGetter !== 'function') {
    throw new Error('Please specify the rowKeyGetter prop to use selection')
  }
}

export function getCellStyle<R, SR>(column: CalculatedColumn<R, SR>): React.CSSProperties {
  return column.frozen
    ? { left: `var(--frozen-left-${column.key})` }
    : { gridColumnStart: column.idx + 1 }
}
