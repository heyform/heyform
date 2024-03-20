import { FC } from 'react'

import { SheetCellProps } from '../types'

export const UrlCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">
      <a href={value} target="_blank" rel="noreferrer">
        {value}
      </a>
    </div>
  )
}
