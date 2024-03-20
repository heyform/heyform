import clsx from 'clsx'
import { memo } from 'react'

import { SELECT_COLUMN_KEY } from './Columns'
import GroupCell from './GroupCell'
import type { CalculatedColumn, Omit, Position, SelectRowEvent } from './types'

export interface GroupRowRendererProps<R, SR = unknown>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  id: string
  groupKey: unknown
  viewportColumns: readonly CalculatedColumn<R, SR>[]
  childRows: readonly R[]
  rowIdx: number
  top: number
  level: number
  selectedCellIdx?: number
  isExpanded: boolean
  isRowSelected: boolean
  selectCell: (position: Position, enableEditor?: boolean) => void
  selectRow: (selectRowEvent: SelectRowEvent) => void
  toggleGroup: (expandedGroupId: unknown) => void
}

function GroupedRow<R, SR>({
  id,
  groupKey,
  viewportColumns,
  childRows,
  rowIdx,
  top,
  level,
  isExpanded,
  selectedCellIdx,
  isRowSelected,
  selectCell,
  selectRow,
  toggleGroup,
  ...props
}: GroupRowRendererProps<R, SR>) {
  // Select is always the first column
  const idx = viewportColumns[0].key === SELECT_COLUMN_KEY ? level + 1 : level

  function selectGroup() {
    selectCell({ rowIdx, idx: -1 })
  }

  return (
    <div
      className={clsx('heygrid-row', 'heygrid-group-row', {
        'heygrid-row-selected': isRowSelected,
        'heygrid-group-row-selected': selectedCellIdx === -1 // Select row if there is no selected cell
      })}
      onClick={selectGroup}
      style={{ top }}
      {...props}
    >
      {viewportColumns.map(column => (
        <GroupCell<R, SR>
          key={column.key}
          id={id}
          rowIdx={rowIdx}
          groupKey={groupKey}
          childRows={childRows}
          isExpanded={isExpanded}
          isRowSelected={isRowSelected}
          isCellSelected={selectedCellIdx === column.idx}
          column={column}
          groupColumnIndex={idx}
          selectRow={selectRow}
          toggleGroup={toggleGroup}
        />
      ))}
    </div>
  )
}

export default memo(GroupedRow) as <R, SR>(props: GroupRowRendererProps<R, SR>) => JSX.Element
