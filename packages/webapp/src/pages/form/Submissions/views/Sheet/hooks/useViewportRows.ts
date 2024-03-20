import { useMemo } from 'react'

import type { GroupByDictionary, GroupRow } from '../types'

const RENDER_BACTCH_SIZE = 8

interface ViewportRowsArgs<R> {
  rawRows: readonly R[]
  rowHeight: number
  clientHeight: number
  scrollTop: number
  groupBy: readonly string[]
  rowGrouper?: (rows: readonly R[], columnKey: string) => Record<string, readonly R[]>
  expandedGroupIds?: ReadonlySet<unknown>
}

// https://github.com/microsoft/TypeScript/issues/41808
function isReadonlyArray(arr: unknown): arr is readonly unknown[] {
  return Array.isArray(arr)
}

export function useViewportRows<R>({
  rawRows,
  rowHeight,
  clientHeight,
  scrollTop,
  groupBy,
  rowGrouper,
  expandedGroupIds
}: ViewportRowsArgs<R>) {
  const [groupedRows, rowsCount] = useMemo(() => {
    if (groupBy.length === 0 || !rowGrouper) return [undefined, rawRows.length]

    const groupRows = (
      rows: readonly R[],
      [groupByKey, ...remainingGroupByKeys]: readonly string[],
      startRowIndex: number
    ): [GroupByDictionary<R>, number] => {
      let groupRowsCount = 0
      const groups: GroupByDictionary<R> = {}
      for (const [key, childRows] of Object.entries(rowGrouper(rows, groupByKey))) {
        // Recursively group each parent group
        const [childGroups, childRowsCount] =
          remainingGroupByKeys.length === 0
            ? [childRows, childRows.length]
            : groupRows(childRows, remainingGroupByKeys, startRowIndex + groupRowsCount)
        groups[key] = {
          childRows,
          childGroups,
          startRowIndex: startRowIndex + groupRowsCount
        }
        groupRowsCount += childRowsCount
      }

      return [groups, groupRowsCount]
    }

    return groupRows(rawRows, groupBy, 0)
  }, [groupBy, rowGrouper, rawRows])

  const [rows, allGroupRows] = useMemo(() => {
    const allGroupRows = new Set<unknown>()
    if (!groupedRows) return [rawRows, allGroupRows]

    const flattenedRows: Array<R | GroupRow<R>> = []
    const expandGroup = (
      rows: GroupByDictionary<R> | readonly R[],
      parentId: string | undefined,
      level: number
    ): void => {
      if (isReadonlyArray(rows)) {
        flattenedRows.push(...rows)
        return
      }
      Object.keys(rows).forEach((groupKey, posInSet, keys) => {
        // TODO: should users have control over the generated key?
        const id = parentId !== undefined ? `${parentId}__${groupKey}` : groupKey
        const isExpanded = expandedGroupIds?.has(id) ?? false
        const { childRows, childGroups, startRowIndex } = rows[groupKey]

        const groupRow: GroupRow<R> = {
          id,
          parentId,
          groupKey,
          isExpanded,
          childRows,
          level,
          posInSet,
          startRowIndex,
          setSize: keys.length
        }
        flattenedRows.push(groupRow)
        allGroupRows.add(groupRow)

        if (isExpanded) {
          expandGroup(childGroups, id, level + 1)
        }
      })
    }

    expandGroup(groupedRows, undefined, 0)
    return [flattenedRows, allGroupRows]
  }, [expandedGroupIds, groupedRows, rawRows])

  const isGroupRow = <R>(row: unknown): row is GroupRow<R> => allGroupRows.has(row)

  const overscanThreshold = 4
  const rowVisibleStartIdx = Math.floor(scrollTop / rowHeight)
  const rowVisibleEndIdx = Math.min(
    rows.length - 1,
    Math.floor((scrollTop + clientHeight) / rowHeight)
  )
  const rowOverscanStartIdx = Math.max(
    0,
    Math.floor((rowVisibleStartIdx - overscanThreshold) / RENDER_BACTCH_SIZE) * RENDER_BACTCH_SIZE
  )
  const rowOverscanEndIdx = Math.min(
    rows.length - 1,
    Math.ceil((rowVisibleEndIdx + overscanThreshold) / RENDER_BACTCH_SIZE) * RENDER_BACTCH_SIZE
  )

  return {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    rows,
    rowsCount,
    isGroupRow
  }
}
