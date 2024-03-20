import type { HeaderCellProps } from '../HeaderCell'
import type { SortDirection } from '../types'

type SharedHeaderCellProps<R, SR> = Pick<
  HeaderCellProps<R, SR>,
  'column' | 'sortColumn' | 'sortDirection' | 'onSort'
>

interface Props<R, SR> extends SharedHeaderCellProps<R, SR> {
  children: React.ReactNode
}

export default function SortableHeaderCell<R, SR>({
  column,
  onSort,
  sortColumn,
  sortDirection,
  children
}: Props<R, SR>) {
  sortDirection = (sortColumn === column.key && sortDirection) || 'NONE'
  let sortText = ''
  if (sortDirection === 'ASC') {
    sortText = '\u25B2'
  } else if (sortDirection === 'DESC') {
    sortText = '\u25BC'
  }

  function onClick() {
    if (!onSort) return
    const { sortDescendingFirst } = column
    let direction: SortDirection
    switch (sortDirection) {
      case 'ASC':
        direction = sortDescendingFirst ? 'NONE' : 'DESC'
        break
      case 'DESC':
        direction = sortDescendingFirst ? 'ASC' : 'NONE'
        break
      default:
        direction = sortDescendingFirst ? 'DESC' : 'ASC'
        break
    }
    onSort(column.key, direction)
  }

  return (
    <span className="heygrid-header-sort-cell" onClick={onClick}>
      <span className="heygrid-header-sort-name">{children}</span>
      <span>{sortText}</span>
    </span>
  )
}
