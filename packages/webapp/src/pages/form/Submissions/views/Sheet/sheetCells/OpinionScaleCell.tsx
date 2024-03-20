import { FC } from 'react'

import { SheetCellProps } from '../types'

export const OpinionScaleCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">
      {value} / {column.properties?.total}
    </div>
  )
}
