import clsx from 'clsx'

import type { HeaderRowProps } from './HeaderRow'
import SortableHeaderCell from './headerCells/SortableHeaderCell'
import type { CalculatedColumn } from './types'

type SharedHeaderRowProps<R, SR> = Pick<
  HeaderRowProps<R, SR>,
  'sortColumn' | 'sortDirection' | 'onSort' | 'allRowsSelected'
>

export interface HeaderCellProps<R, SR> extends SharedHeaderRowProps<R, SR> {
  column: CalculatedColumn<R, SR>
  onResize: (column: CalculatedColumn<R, SR>, width: number) => void
  onAllRowsSelectionChange: (checked: boolean) => void
}

export default function HeaderCell<R, SR>({
  column,
  onResize,
  allRowsSelected,
  onAllRowsSelectionChange,
  sortColumn,
  sortDirection,
  onSort
}: HeaderCellProps<R, SR>) {
  let handlerOffsetLeft = Number(column.width) - 4

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      return
    }

    const { currentTarget, pointerId } = event
    const { right } = currentTarget.getBoundingClientRect()
    const offset = right - event.clientX

    if (offset > 11) {
      // +1px to account for the border size
      return
    }

    const handler: HTMLDivElement = currentTarget.querySelector('.heygrid-resize-handler')!

    currentTarget.classList.add('heygrid-cell-resizing')

    function onPointerMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return
      if (event.pointerType === 'mouse' && event.buttons !== 1) {
        onPointerUp()
        return
      }
      const left = Math.floor(event.clientX + offset - currentTarget.getBoundingClientRect().left)

      if (left > 0) {
        handler.style.left = `${left}px`
        handlerOffsetLeft = left
      }
    }

    function onPointerUp() {
      currentTarget.classList.remove('heygrid-cell-resizing')

      if (event.pointerId !== pointerId) return
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      onResize(column, handlerOffsetLeft + 4)
    }

    event.preventDefault()
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function getCell() {
    if (column.headerRenderer) {
      return (
        <column.headerRenderer
          column={column}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
          allRowsSelected={allRowsSelected}
          onAllRowsSelectionChange={onAllRowsSelectionChange}
        />
      )
    }

    if (column.sortable) {
      return (
        <SortableHeaderCell
          column={column}
          onSort={onSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        >
          {column.name}
        </SortableHeaderCell>
      )
    }

    return column.name
  }

  const className = clsx('heygrid-cell', column.headerCellClass, {
    'heygrid-cell-resizable': column.resizable,
    'heygrid-cell-frozen': column.frozen,
    'heygrid-cell-frozen-last': column.isLastFrozenColumn
  })

  return (
    <div
      className={className}
      style={{
        left: column.left,
        width: column.width
      }}
      onPointerDown={column.resizable ? onPointerDown : undefined}
    >
      {getCell()}
      <div
        style={{
          left: Number(column.width) - 4
        }}
        className="heygrid-resize-handler"
      />
    </div>
  )
}
