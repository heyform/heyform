import clsx from 'clsx'
import type { RefAttributes } from 'react'
import { forwardRef, memo } from 'react'

import type { CellRendererProps } from './types'

function Cell<R, SR>(
  {
    className,
    column,
    isCellSelected,
    isCopied,
    isDraggedOver,
    isRowSelected,
    row,
    rowIdx,
    dragHandleProps,
    onRowClick,
    onClick,
    onDoubleClick,
    onContextMenu,
    onRowChange,
    onRowExpand,
    selectCell,
    selectRow,
    ...props
  }: CellRendererProps<R, SR>,
  ref: React.Ref<HTMLDivElement>
) {
  const { cellClass } = column
  className = clsx(
    'heygrid-cell',
    {
      'heygrid-cell-frozen': column.frozen,
      'heygrid-cell-frozen-last': column.isLastFrozenColumn,
      'heygrid-cell-selected': isCellSelected,
      'heygrid-cell-copied': isCopied,
      'heygrid-cell-dragged-over': isDraggedOver
    },
    typeof cellClass === 'function' ? cellClass(row) : cellClass,
    className
  )

  function selectCellWrapper(openEditor?: boolean) {
    selectCell({ idx: column.idx, rowIdx }, openEditor)
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    selectCellWrapper(column.editorOptions?.editOnClick)
    onRowClick?.(rowIdx, row, column)
    onClick?.(event)
  }

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    selectCellWrapper()
    onContextMenu?.(event)
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    selectCellWrapper(true)
    onDoubleClick?.(event)
  }

  function handleRowChange(newRow: R) {
    onRowChange(rowIdx, newRow)
  }

  function handleRowExpand() {
    onRowExpand(rowIdx, row)
  }

  function onRowSelectionChange(checked: boolean, isShiftClick: boolean) {
    selectRow({ rowIdx, checked, isShiftClick })
  }

  return (
    <div
      role="gridcell"
      ref={ref}
      className={className}
      style={{
        left: column.left,
        width: column.width
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      {...props}
    >
      {!column.rowGroup && (
        <>
          <column.formatter
            column={column}
            rowIdx={rowIdx}
            row={row}
            isCellSelected={isCellSelected}
            isRowSelected={isRowSelected}
            onRowSelectionChange={onRowSelectionChange}
            onRowChange={handleRowChange}
            onRowExpand={handleRowExpand}
          />
          {dragHandleProps && <div className="heygrid-cell-drag-handle" {...dragHandleProps} />}
        </>
      )}
    </div>
  )
}

export default memo(forwardRef(Cell)) as <R, SR = unknown>(
  props: CellRendererProps<R, SR> & RefAttributes<HTMLDivElement>
) => JSX.Element
