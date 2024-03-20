import { FC } from 'react'

import { SheetCellProps } from '../types'

export const DateRangeCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]
  const arrays = [value?.start, value?.end].filter(Boolean)

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">
      {arrays.join('  -  ')}
    </div>
  )
}
