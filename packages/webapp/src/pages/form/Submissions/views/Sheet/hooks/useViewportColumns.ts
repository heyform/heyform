import { useMemo } from 'react'

import { SELECT_COLUMN_KEY } from '../Columns'
import type { DataGridProps } from '../DataGrid'
import { ToggleGroupFormatter, ValueFormatter } from '../formatters'
import type { CalculatedColumn, Column, ColumnMetric } from '../types'

interface ViewportColumnsArgs<R, SR> extends Pick<DataGridProps<R, SR>, 'defaultColumnOptions'> {
  rawColumns: readonly Column<R, SR>[]
  rawGroupBy?: readonly string[]
  viewportWidth: number
  scrollLeft: number
  columnWidths: ReadonlyMap<string, number>
}

export function useViewportColumns<R, SR>({
  rawColumns,
  columnWidths,
  viewportWidth,
  defaultColumnOptions,
  rawGroupBy
}: ViewportColumnsArgs<R, SR>) {
  const minColumnWidth = defaultColumnOptions?.minWidth ?? 80
  const defaultFormatter = defaultColumnOptions?.formatter ?? ValueFormatter
  const defaultSortable = defaultColumnOptions?.sortable ?? false
  const defaultResizable = defaultColumnOptions?.resizable ?? false

  const { columns, lastFrozenColumnIndex, groupBy } = useMemo(() => {
    // Filter rawGroupBy and ignore keys that do not match the columns prop
    const groupBy: string[] = []
    let lastFrozenColumnIndex = -1

    const columns = rawColumns.map(rawColumn => {
      const rowGroup = rawGroupBy?.includes(rawColumn.key) ?? false
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const frozen = rowGroup || rawColumn.frozen || false

      const column: CalculatedColumn<R, SR> = {
        ...rawColumn,
        idx: 0,
        frozen,
        isLastFrozenColumn: false,
        rowGroup,
        sortable: rawColumn.sortable ?? defaultSortable,
        resizable: rawColumn.resizable ?? defaultResizable,
        formatter: rawColumn.formatter ?? defaultFormatter
      }

      if (rowGroup) {
        column.groupFormatter = ToggleGroupFormatter
      }

      if (frozen) {
        lastFrozenColumnIndex++
      }

      return column
    })

    columns.sort(({ key: aKey, frozen: frozenA }, { key: bKey, frozen: frozenB }) => {
      // Sort select column first:
      if (aKey === SELECT_COLUMN_KEY) return -1
      if (bKey === SELECT_COLUMN_KEY) return 1

      // Sort grouped columns second, following the groupBy order:
      if (rawGroupBy?.includes(aKey)) {
        if (rawGroupBy.includes(bKey)) {
          return rawGroupBy.indexOf(aKey) - rawGroupBy.indexOf(bKey)
        }
        return -1
      }
      if (rawGroupBy?.includes(bKey)) return 1

      // Sort frozen columns third:
      if (frozenA) {
        if (frozenB) return 0
        return -1
      }
      if (frozenB) return 1

      // Sort other columns last:
      return 0
    })

    columns.forEach((column, idx) => {
      column.idx = idx

      if (column.rowGroup) {
        groupBy.push(column.key)
      }
    })

    if (lastFrozenColumnIndex !== -1) {
      columns[lastFrozenColumnIndex].isLastFrozenColumn = true
    }

    return {
      columns,
      lastFrozenColumnIndex,
      groupBy
    }
  }, [rawColumns, defaultFormatter, defaultResizable, defaultSortable, rawGroupBy])

  const { totalColumnWidth, totalFrozenColumnWidth, columnMetrics } = useMemo(() => {
    const columnMetrics = new Map<CalculatedColumn<R, SR>, ColumnMetric>()
    let left = 0
    let totalColumnWidth = 0
    let totalFrozenColumnWidth = 0
    let allocatedWidth = 0
    let unassignedColumnsCount = 0

    for (const column of columns) {
      let width = getSpecifiedWidth(column, columnWidths, viewportWidth)

      if (width === undefined) {
        unassignedColumnsCount++
      } else {
        width = clampColumnWidth(width, column, minColumnWidth)
        allocatedWidth += width
        columnMetrics.set(column, { width, left: 0 })
      }
    }

    const unallocatedWidth = viewportWidth - allocatedWidth
    const unallocatedColumnWidth = unallocatedWidth / unassignedColumnsCount

    for (const column of columns) {
      let width
      if (columnMetrics.has(column)) {
        const columnMetric = columnMetrics.get(column)!
        columnMetric.left = left
        ;({ width } = columnMetric)
      } else {
        width = clampColumnWidth(unallocatedColumnWidth, column, minColumnWidth)
        columnMetrics.set(column, { width, left })
      }
      column.width = width
      column.left = left
      totalColumnWidth += width
      left += width
    }

    if (lastFrozenColumnIndex !== -1) {
      const columnMetric = columnMetrics.get(columns[lastFrozenColumnIndex])!
      totalFrozenColumnWidth = columnMetric.left + columnMetric.width
    }

    return {
      totalColumnWidth,
      totalFrozenColumnWidth,
      columnMetrics
    }
  }, [columnWidths, columns, viewportWidth, minColumnWidth, lastFrozenColumnIndex])

  return {
    columns,
    viewportColumns: columns,
    columnMetrics,
    totalColumnWidth,
    lastFrozenColumnIndex,
    totalFrozenColumnWidth,
    groupBy
  }
}

function getSpecifiedWidth<R, SR>(
  { key, width }: Column<R, SR>,
  columnWidths: ReadonlyMap<string, number>,
  viewportWidth: number
): number | undefined {
  if (columnWidths.has(key)) {
    // Use the resized width if available
    return columnWidths.get(key)
  }
  if (typeof width === 'number') {
    return width
  }
  if (typeof width === 'string' && /^\d+%$/.test(width)) {
    return Math.floor((viewportWidth * parseInt(width, 10)) / 100)
  }
  return undefined
}

function clampColumnWidth<R, SR>(
  width: number,
  { minWidth, maxWidth }: Column<R, SR>,
  minColumnWidth: number
): number {
  width = Math.max(width, minWidth ?? minColumnWidth)

  if (typeof maxWidth === 'number') {
    return Math.min(width, maxWidth)
  }

  return width
}
